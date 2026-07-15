---
title: "Python SDK"
weight: 20
lede: "A typed client for the REST API."
description: "The uptimer-python-sdk package."
---

```sh
pip install "uptimer-python-sdk>=0.4.0"      # or: uv add "uptimer-python-sdk>=0.4.0"
```

Assigning regions when creating a rule needs **0.4.0 or newer**.

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

Assign [regions](/v1.3.0/core-concepts/regions/) on a rule with its `regions` field (region names,
matched by name). A rule with no region stays at "No Data", so assign at least one:

```python
from uptimer.models.rule import (
    CreateRuleRequest, RuleRequest, RuleResponse, RuleResponseBody,
)

regions = [r.name for r in client.v1.regions.all()]   # names available on this instance
rule = client.v1.rules.create(CreateRuleRequest(
    name="home",
    interval=60,
    workspace_id=ws.id,
    request=RuleRequest(url="https://example.com", method="GET", content_type="", data=""),
    response=RuleResponse(statuses=[200], body=RuleResponseBody(content="")),
    regions=regions[:1],
))
print(rule.regions)                      # ["local"]
```

Errors raise `DefaultUptimerApiError` (the API returned an `error` envelope) or
`UptimerInvalidHttpCodeError` (a genuine non-200 transport error). Source and releases on
[PyPI](https://pypi.org/project/uptimer-python-sdk/) and
[GitHub](https://github.com/myuptime-info/uptimer-python-sdk).
