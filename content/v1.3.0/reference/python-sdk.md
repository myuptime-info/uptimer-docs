---
title: "Python SDK"
weight: 20
lede: "A typed client for the REST API."
description: "The uptimer-python-sdk package."
---

```sh
pip install uptimer-python-sdk      # or: uv add uptimer-python-sdk
```

```python
from uptimer.client import UptimerClient

client = UptimerClient(
    api_key="<your-api-key>",
    base_url="http://localhost:2517/api",
)

print(client.version())                  # "1.3.0"
ws = client.v1.workspaces.all()[0]
print(client.v1.rules.all(ws.id))
```

For the hosted service use `UptimerCloudClient(api_key=...)` — it targets
`https://api.myuptime.info`.

## Coverage

`client.v1` mirrors the REST API:

- `client.v1.workspaces.all()`
- `client.v1.regions.all()`
- `client.v1.rules.all(workspace_id)` · `.create(...)` · `.update(id, ...)` · `.delete(id)`

Errors raise `DefaultUptimerApiError` (the API returned an `error` envelope) or
`UptimerInvalidHttpCodeError` (a genuine non-200 transport error). Source and releases on
[PyPI](https://pypi.org/project/uptimer-python-sdk/) and
[GitHub](https://github.com/myuptime-info/uptimer-python-sdk).
