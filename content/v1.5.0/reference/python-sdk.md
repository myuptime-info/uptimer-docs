---
title: "Python SDK"
weight: 20
lede: "A typed client for the REST API."
description: "The uptimer-python-sdk package."
---

```sh
pip install "uptimer-python-sdk>=1.5.0"      # or: uv add "uptimer-python-sdk>=1.5.0"
```

**The SDK version tracks the server it targets.** 1.5.x speaks to uptimer 1.5.0 and
later; patch numbers move independently. So install the SDK whose major.minor matches
your server — no compatibility table to look up.

Still on API v1? Pin `uptimer-python-sdk<1`. The server's v1 is unchanged and
supported, so 0.4.x keeps working against a 1.5.0 server — it just cannot use anything
new. There is no v1 surface left in 1.5.x: `client.v1`, its models and its kinds are
gone — `client.v2` takes its place.

## A complete example

One script, the whole surface: connect, check the server, list what is there, create
website monitoring, read it back, change it, look for incidents, and clean up. Set
`UPTIMER_API_KEY` and `UPTIMER_BASE_URL` and it runs as-is.

```python
"""An end-to-end tour of uptimer-python-sdk 1.5.x."""

import os

from uptimer.client import UptimerClient
from uptimer.errors import DefaultUptimerApiError, IncompatibleServerError
from uptimer.models.v2 import (
    AGREEMENT_MAJORITY,
    STATUS_PENDING,
    CreateWebsiteMonitorRequest,
    UpdateWebsiteMonitorRequest,
    WebsiteMonitorRequest,
    WebsiteMonitorResponse,
    WebsiteMonitorResponseBody,
)

client = UptimerClient(
    api_key=os.environ["UPTIMER_API_KEY"],
    base_url=os.environ.get("UPTIMER_BASE_URL", "http://localhost:2517/api"),
)
# For the hosted product, swap the two lines above for:
#   from uptimer.client import UptimerCloudClient
#   client = UptimerCloudClient(api_key=os.environ["UPTIMER_API_KEY"])

# 1. Fail fast on a server that has no API v2, with a message that names the fix
#    rather than a 404 on the first real call. Both this and client.version()
#    read the shared, unversioned /version.
try:
    print("server:", client.check_compatibility())
except IncompatibleServerError as exc:
    raise SystemExit(str(exc)) from exc

print("version:", client.version())   # same endpoint, no compatibility gate
# client.ensure_compatible() is the same check, run at most once per client.

# 2. Everything the API versions is reached through client.v2.
workspace = client.v2.workspaces.all()[0]
print("workspace:", workspace.id, workspace.name, f"({workspace.role})")

locations = client.v2.locations.all()
for location in locations:
    print("location:", location.name, location.active_workers_count, "worker(s)")

# 3. Create website monitoring. This one call also creates the monitoring
#    subject, its built-in HTTP signal and its Reachability rule.
monitor = client.v2.monitoring.websites.create(
    CreateWebsiteMonitorRequest(
        name="Checkout API",
        interval=60,                   # seconds, in whole minutes (>= 60)
        workspace_id=workspace.id,     # required on create; fixed afterwards
        request=WebsiteMonitorRequest(
            url="https://checkout.example/health",
            method="GET",              # GET, POST, PATCH or OPTIONS
        ),
        response=WebsiteMonitorResponse(
            statuses=[200],
            body=WebsiteMonitorResponseBody(content=""),   # "" = don't check the body
        ),
        locations=[loc.name for loc in locations[:1]],     # names, not ids
        agreement=AGREEMENT_MAJORITY,  # "any" | "majority" | "all"
    ),
)
print("created:", monitor.id, monitor.locations, monitor.agreement)

try:
    # 4. Read it back, in the workspace listing and on its own.
    listed = client.v2.monitoring.websites.all(workspace.id)
    print("monitors here:", [m.name for m in listed])

    fetched = client.v2.monitoring.websites.get(monitor.id)
    print("fetched:", fetched.name, fetched.request.url, fetched.response.statuses)

    # 5. Update replaces the whole configuration — send every field you want to
    #    keep. There is no workspace_id: a monitor cannot change workspace. An
    #    omitted agreement keeps the stored one instead of resetting it.
    updated = client.v2.monitoring.websites.update(
        monitor.id,
        UpdateWebsiteMonitorRequest(
            name="Checkout API (health)",
            interval=120,
            request=WebsiteMonitorRequest(
                url="https://checkout.example/health",
                method="GET",
            ),
            response=WebsiteMonitorResponse(
                statuses=[200, 204],
                body=WebsiteMonitorResponseBody(content="ok"),
            ),
            locations=fetched.locations,   # replaces the stored list
        ),
    )
    print("updated:", updated.interval, updated.agreement)   # agreement survived

    # 6. What is wrong right now. Only open incidents come back, newest trouble
    #    first. A monitor created seconds ago has nothing open yet — this is the
    #    loop you would run against a workspace that has been up for a while.
    for incident in client.v2.incidents.all(workspace.id):
        note = " (nobody notified yet)" if incident.status == STATUS_PENDING else ""
        print(f"{incident.monitor_name}: {incident.status}{note}")
        print("  since   ", incident.trouble_since)
        print("  failing:", incident.locations.failing or "-")
        print("  unknown:", incident.locations.unknown or "-")

    # Narrow it to one monitor:
    mine = client.v2.incidents.all(workspace.id, monitor_id=monitor.id)
    print("open on this monitor:", len(mine))

except DefaultUptimerApiError as exc:
    # The API answered with an error envelope. Branch on .code — see Errors below.
    print("api error:", exc.code, exc.error_type, exc.message, exc.details)
finally:
    # 7. Clean up whatever happened above. Deleting the monitor removes its
    #    subject, signal, rule and history with it.
    deleted = client.v2.monitoring.websites.delete(monitor.id)
    print(deleted.message, deleted.monitor_id)
```

The rest of this page explains the pieces.

## What is available

**Resources live under the API version that serves them.** The REST API is
[versioned by path](/v1.5.0/reference/rest-api/#two-versions), and the SDK keeps that
version visible rather than hiding it: everything v2 offers is reached through
`client.v2`, and there are no root-level aliases.

- `client.v2.workspaces.all()`
- `client.v2.locations.all()`
- `client.v2.incidents.all(workspace_id, monitor_id=None)` — **open** incidents
- `client.v2.monitoring.websites.all(workspace_id)` · `.get(id)` · `.create(...)` ·
  `.update(id, ...)` · `.delete(id)`

The types those calls take and return are versioned the same way — import them from
**`uptimer.models.v2`**:

```python
from uptimer.models.v2 import CreateWebsiteMonitorRequest, Incident, Location
```

They are not exported from `uptimer.models`, and there are no flat aliases, so a stale
import fails loudly rather than binding to something else.

Two things stay off the version namespaces, because
[`GET /version`](/v1.5.0/reference/rest-api/#get-the-server-version) is shared by both
API versions rather than belonging to either:

- `client.version()` — the server version
- `client.check_compatibility()` / `client.ensure_compatible()`

The deserialization exceptions (`ModelError`, `TypeMismatchError`, …) stay on
`uptimer.models` for the same reason: the same error is raised whichever API version
produced the payload.

Website monitoring sits under `client.v2.monitoring` because it is a built-in template,
not the general monitor model.

Every model carries the API's `kind`, and the SDK strips `kind` out of anything it
sends: it is the server telling you what an object is, not a field you set.

## Checking the server first

`check_compatibility()` reads `/version` — the one unversioned endpoint, so it works
against a server too old for the rest of the SDK — and raises `IncompatibleServerError`
if that server predates API v2. The bar is the SDK's own major.minor: **1.5.x needs
uptimer 1.5.0+ (or myuptime.info 15.1.0+)**. A server reporting something that is not a
release number, such as a `dev` build from source, is treated as usable rather than
locked out.

## Locations and agreement

Assign [locations](/v1.5.0/core-concepts/locations/) with the `locations` field. It takes
location **names**, as listed by `client.v2.locations.all()` — not ids. A monitor with
none is never checked and stays at no data.

`agreement` is how many of those locations must report a problem before the monitor
does: `AGREEMENT_ANY`, `AGREEMENT_MAJORITY` or `AGREEMENT_ALL` from `uptimer.models.v2`
(the wire values are `"any"`, `"majority"` and `"all"`).

Two things behave differently between `CreateWebsiteMonitorRequest` and
`UpdateWebsiteMonitorRequest`:

- `workspace_id` exists only on create. A monitor cannot change workspace, so the
  update request has no such field.
- On update, `locations` **replaces** the stored list — include the ones you want to
  keep — while an omitted `agreement` **keeps** the stored value rather than resetting
  it to the default.

## Incident status

`client.v2.incidents.all()` returns only **open** incidents, newest trouble first. Pass
`monitor_id=` to narrow it to one monitor. Closed incidents are history and live on the
subject timeline in the dashboard; there is no incident-history endpoint in this release.

`status` carries the same words the dashboard shows — `STATUS_OK`, `STATUS_PENDING`,
`STATUS_PROBLEM`, `STATUS_NO_DATA`, `STATUS_RECOVERING`. `pending` is the one to watch:
the monitor is failing but still inside the confirm hold, so **nobody has been notified
yet**.

`incident.locations` splits the evidence into `.failing`, `.unknown` and `.ok`. A
location that has never reported stays in `unknown` and still counts toward the
agreement — that is a real state, not a missing one.

## Errors

All of these subclass `UptimerError`, in `uptimer.errors`:

- `DefaultUptimerApiError` — the API returned an `error` envelope. Carries `.code`,
  `.error_type`, `.message` and `.details`; branch on `.code`, which is finer-grained
  than `.error_type` (see [Errors](/v1.5.0/reference/rest-api/#errors)).
- `IncompatibleServerError` — the server does not provide API v2. Carries
  `.server_version`. Upgrade the server, or use `uptimer-python-sdk<1`.
- `UptimerInvalidHttpCodeError` — a genuine non-200 transport error. Carries `.url` and
  `.status_code`.
- `UptimerInvalidResponseError` — the body was not the expected envelope.

## Migrating from 0.4.x

| 0.4.x (API v1) | 1.5.0 (API v2) |
|---|---|
| `client.v1.workspaces` | `client.v2.workspaces` |
| `client.v1.regions` | `client.v2.locations` |
| `client.v1.rules` | `client.v2.monitoring.websites` |
| `Region` | `Location` |
| `Rule` / `CreateRuleRequest` | `WebsiteMonitor` / `CreateWebsiteMonitorRequest` |
| `regions=[...]` | `locations=[...]` |
| — | `agreement=...`, `client.v2.incidents` |
| — | `client.check_compatibility()` |
| `from uptimer.models import …` | `from uptimer.models.v2 import …` |

**The version namespace is the shape you already know.** 0.4.x reached API v1 through
`client.v1`; 1.5.x reaches API v2 through `client.v2`. What moves is the version, not
the pattern — and the types moved with it: `uptimer.models` becomes
`uptimer.models.v2`.

`client.version()` is unchanged and still sits on the client, not under `client.v2` —
`/version` is a shared global endpoint, not a versioned one.
`UptimerClient(api_key=…, base_url=…)` and `UptimerCloudClient(api_key=…)` are
constructed exactly as before, and both expose the same `client.v2`.

The rename is not only the namespace: `regions=[...]` becomes `locations=[...]`, and
what 0.4.x called a rule is a **website monitor**. What the server stores is the same
object, so a monitor created with 0.4.x is the one 1.5.x reads back.

Source and releases on [PyPI](https://pypi.org/project/uptimer-python-sdk/) and
[GitHub](https://github.com/myuptime-info/uptimer-python-sdk).
