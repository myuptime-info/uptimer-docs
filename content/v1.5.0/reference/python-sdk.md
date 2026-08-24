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
gone.

## Quick start

```python
from uptimer.client import UptimerClient

client = UptimerClient(api_key="…", base_url="http://localhost:2517/api")

# Optional, but it fails with a message that names the fix rather than a 404
# on your first real call.
print(client.check_compatibility())   # or client.ensure_compatible(), which checks once

ws = client.workspaces.all()[0]
print(client.monitoring.websites.all(ws.id))
```

For the hosted product use `UptimerCloudClient(api_key="…")`.

## What is available

The client mirrors [API v2](/v1.5.0/reference/rest-api/):

- `client.workspaces.all()`
- `client.locations.all()`
- `client.incidents.all(workspace_id, monitor_id=None)` — **open** incidents
- `client.monitoring.websites.all(workspace_id)` · `.get(id)` · `.create(...)` ·
  `.update(id, ...)` · `.delete(id)`
- `client.version()` — the server version, from the shared unversioned `/version`

Website monitoring sits under `client.monitoring` because it is a built-in template,
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

## Create website monitoring

```python
from uptimer.models import (
    AGREEMENT_MAJORITY, CreateWebsiteMonitorRequest,
    WebsiteMonitorRequest, WebsiteMonitorResponse, WebsiteMonitorResponseBody,
)

locations = [loc.name for loc in client.locations.all()]   # names on this instance
monitor = client.monitoring.websites.create(CreateWebsiteMonitorRequest(
    name="home",
    interval=60,
    workspace_id=ws.id,
    request=WebsiteMonitorRequest(url="https://example.com", method="GET"),
    response=WebsiteMonitorResponse(
        statuses=[200], body=WebsiteMonitorResponseBody(content=""),
    ),
    locations=locations[:1],
    agreement=AGREEMENT_MAJORITY,   # "any" | "majority" | "all"
))
print(monitor.locations)            # ["local"]
```

Assign [locations](/v1.5.0/core-concepts/locations/) with the `locations` field (names,
as listed by `client.locations.all()`). A monitor with none is never checked and stays
at no data. On update the list **replaces** the stored one.

Omitting `agreement` on update keeps the stored value — it is not reset to the default.

## Read what is wrong

```python
for incident in client.incidents.all(ws.id):
    print(incident.monitor_name, incident.status, incident.locations.failing)
```

`status` carries the same words the dashboard shows. `pending` is the one to watch:
the monitor is failing but still inside the confirm hold, so **nobody has been notified
yet**.

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
| `client.v1.workspaces` | `client.workspaces` |
| `client.v1.regions` | `client.locations` |
| `client.v1.rules` | `client.monitoring.websites` |
| `Region` | `Location` |
| `Rule` / `CreateRuleRequest` | `WebsiteMonitor` / `CreateWebsiteMonitorRequest` |
| `regions=[...]` | `locations=[...]` |
| — | `agreement=...`, `client.incidents` |
| — | `client.check_compatibility()` |

`client.version()` is unchanged — `/version` is a shared global endpoint, not a
versioned one. `UptimerClient(api_key=…, base_url=…)` and `UptimerCloudClient(api_key=…)`
are constructed exactly as before.

The rename is not only the namespace: `regions=[...]` becomes `locations=[...]`, and
what 0.4.x called a rule is a **website monitor**. What the server stores is the same
object, so a monitor created with 0.4.x is the one 1.5.x reads back.

Source and releases on [PyPI](https://pypi.org/project/uptimer-python-sdk/) and
[GitHub](https://github.com/myuptime-info/uptimer-python-sdk).
