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
supported, so 0.4.x keeps working — it just cannot use anything below.

## Quick start

```python
from uptimer.client import UptimerClient

client = UptimerClient(api_key="…", base_url="http://localhost:2517/api")

# Optional, but it fails with a message that names the fix rather than a 404
# on your first real call.
print(client.check_compatibility())

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

- `DefaultUptimerApiError` — the API returned an `error` envelope.
- `IncompatibleServerError` — the server does not provide API v2. Upgrade it, or use
  `uptimer-python-sdk<1`.
- `UptimerInvalidHttpCodeError` — a genuine non-200 transport error.

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

Source and releases on [PyPI](https://pypi.org/project/uptimer-python-sdk/) and
[GitHub](https://github.com/myuptime-info/uptimer-python-sdk).
