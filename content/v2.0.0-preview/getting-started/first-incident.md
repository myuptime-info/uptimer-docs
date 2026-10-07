---
title: "From an API key to an Incident"
weight: 20
lede: "Create a Resource, send it an Observation, and read the Rule result and the Incident with API v3 and the Python SDK 2.0."
---

> Preview build. The Python SDK 2.0 is installed from a local wheel for the field test; it is not on PyPI yet. Do not install a prerelease from a package index.

You need a running Uptimer 2.0 with at least one Location (see the [Quickstart](/v2.0.0-preview/getting-started/quick-start/)) and Python 3.9 or later.

## 1. Create an API key

Open **API keys → New key**, name it, and copy the token. It is shown once. The key acts as you: it reads and writes what you may in each Workspace.

```bash
export UPTIMER_URL=http://localhost:8080/api
export UPTIMER_API_KEY=<the token>
# export UPTIMER_WORKSPACE="<id or name>"  # only when the key reaches more than one Workspace
```

A key that reaches several Workspaces writes only after you choose one: the examples below stop
and list the Workspaces until `UPTIMER_WORKSPACE` names one. With a single Workspace, leave it
unset.

## 2. Install the SDK wheel

Install the wheel file from the field-test pack into a clean environment:

```bash
python3 -m venv uptimer-env
uptimer-env/bin/pip install ./uptimer_python_sdk-2.0.0-py3-none-any.whl
```

## 3. Create a Resource and send an Observation

```python
import os
import sys
import time

from uptimer import NotFoundError, UptimerClient


def chosen_workspace(client):
    """The Workspace UPTIMER_WORKSPACE names (its id or name), or the only one this key reaches."""
    want = os.environ.get("UPTIMER_WORKSPACE", "")
    reachable = client.workspaces()
    matching = [w for w in reachable if want in (w.id, w.name)] if want else reachable
    if len(matching) != 1:
        choices = ", ".join(f"{w.id} ({w.name})" for w in reachable)
        problem = f"no single Workspace is called {want!r}" if want else f"this key reaches {len(reachable)} Workspaces"
        sys.exit(f"{problem}; set UPTIMER_WORKSPACE to one of: {choices}")
    return client.workspace(matching[0].id)


client = UptimerClient(api_key=os.environ["UPTIMER_API_KEY"], base_url=os.environ["UPTIMER_URL"])
client.check_compatibility()

ws = chosen_workspace(client)
location = client.locations()[0]

try:
    resource = ws.resources.get("checkout-api")
except NotFoundError:
    resource = ws.resources.create(
        template="website-check",
        key="checkout-api",
        name="Checkout API",
        meta={
            "url": "https://checkout.example.com/health",
            "locations": [location.id],
            "interval_value": 5,
            "interval_unit": "MINUTE",
            "failure_mode": "at_least_one",
            "confirm_after": 0,
            "recover_after": 0,
        },
    )

signal = resource.signals[0]
ws.resources.observe(resource.key, signal=signal.key, state="problem", labels={"status": "503"})

for _ in range(20):
    rule = ws.resources.get(resource.key).rules[0]
    if rule.open_incident:
        break
    time.sleep(0.5)
print(f"rule {rule.key}: {rule.status} - {rule.explanation}")

incident = ws.incidents.get(rule.open_incident)
print(f"incident {incident.id}: {incident.lifecycle}, {incident.confirmation}, {incident.condition}")
for step in incident.history:
    print(f"  {step.at:%H:%M:%S} {step.kind:<16} {step.explanation}")
```

```bash
uptimer-env/bin/python quickstart.py
```

```text
rule availability: problem - 1 of 1 location failing
incident sexCVBKlJuaa: open, confirmed, problem
  18:29:32 opened           1 of 1 location failing
  18:29:32 confirmed        1 of 1 location failing
```

Every id is a public id. You never need a database row number.

## The same with curl

```bash
H="Authorization: Bearer $UPTIMER_API_KEY"
API=$UPTIMER_URL/v3

# Which Workspace: the only one this key reaches, or the one UPTIMER_WORKSPACE
# names by id or name. See them: curl -s -H "$H" $API/workspaces | jq -r '.result[] | "\(.id)  \(.name)"'
WS=$(curl -s -H "$H" $API/workspaces | jq -er --arg want "${UPTIMER_WORKSPACE:-}" '
  .result as $all | ($all | map("\(.id) (\(.name))") | join(", ")) as $choices
  | if $want != "" then [$all[] | select(.id == $want or .name == $want)]
      | if length == 1 then .[0].id else error("no single Workspace is called \($want); choose one of: \($choices)") end
    elif ($all | length) == 1 then $all[0].id
    else error("this key reaches \($all | length) Workspaces; set UPTIMER_WORKSPACE to one of: \($choices)") end') || unset WS
LOC=$(curl -s -H "$H" $API/locations | jq -r '.result[0].id')

curl -s -H "$H" -X POST $API/workspaces/$WS/resources \
  -d '{"template": "website-check", "key": "orders-api", "name": "Orders API",
       "meta": {"url": "https://orders.example.com/health", "locations": ["'$LOC'"],
                "interval_value": 5, "interval_unit": "MINUTE",
                "failure_mode": "at_least_one", "confirm_after": 0, "recover_after": 0}}'

SIGNAL=$(curl -s -H "$H" $API/workspaces/$WS/resources/orders-api | jq -r '.result.signals[0].key')
curl -s -H "$H" -X POST $API/workspaces/$WS/resources/orders-api/observations \
  -d '{"signal": "'$SIGNAL'", "state": "problem"}'

curl -s -H "$H" $API/workspaces/$WS/resources/orders-api | jq '.result.rules[0]'
```

## Next

- [API v3 reference](/v2.0.0-preview/reference/rest-api/): every route, the error model and paging.
- [Python SDK reference](/v2.0.0-preview/reference/python-sdk/): Incidents, filters, maintenance and errors.
