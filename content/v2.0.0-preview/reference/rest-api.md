---
title: "API v3"
weight: 10
lede: "The public API of Uptimer 2.0: Resources, Templates, Observations, Incidents, maintenance and acknowledgement."
---

The public API of Uptimer 2.0: Resources, Templates, Observations, Incidents,
maintenance and acknowledgement. The Python SDK 2.0 (`uptimer-python-sdk`)
wraps every route here. `uptimer mcp` offers it to MCP
clients ([MCP](/v2.0.0-preview/reference/mcp/)).

## Calling it

Base path `/api/v3`. Send a person's API key (User → API keys):

```text
Authorization: Bearer <api key>
```

A **full** key reads and writes what its owner may in each Workspace: every
member reads; creating, changing, sending Observations and maintenance need
editor or owner; any member may acknowledge. An Observation address is not a
key and reads nothing here.

A **scoped** key (User → API keys → Access: Scoped) reaches one Workspace. It
reads everything there and takes only the actions it was given:
`acknowledge`, `maintenance` (start and end), `observe` (send Observations).
It never creates or changes Resources. Its owner's role still applies on top:
a viewer's scoped key cannot start maintenance. Any other Workspace answers
404. A scoped key is not accepted as the second factor of an Observation
address. `uptimer mcp` uses these keys; see
[MCP](/v2.0.0-preview/reference/mcp/).

Every write, refused or not, and every read of recorded evidence is kept in
`server_api_audit`: time, person, key, Workspace, method, path, status and
User-Agent (`uptimer-mcp/<version>` for MCP calls). Recorded evidence means an
Incident with its history (`GET …/incidents/{id}`), its deliveries
(`…/incidents/{id}/deliveries`) and the Observation log
(`GET …/resources/{r}/observations`). Lists of Workspaces, Templates,
Locations, Resources and Incidents, and a Resource's detail, are not
recorded.

Identifiers are public ids (short strings). A Resource is also addressed by
its `key`.

## Answers and errors

Every answer is one envelope:

```json
{"result": …, "error": null, "meta": null}
{"result": null, "error": {"code": 1422, "error_type": "validation", "message": "…", "details": {"field": "url"}}, "meta": null}
```

| HTTP | `code` | `error_type` | Meaning |
|---|---|---|---|
| 400 | 1400 | `bad_request` | The body is not JSON this route reads (unknown fields are refused). |
| 401 | 1401 | `auth` | No key, or one this installation does not accept. |
| 403 | 1403 | `forbidden` | A member whose role does not allow this write, or a scoped key without the action; then `details.scope` names it (`acknowledge`, `maintenance`, `observe`, or `full`). |
| 404 | 1404 | `not_found` | No such route, Workspace, Resource or Incident — including one in a Workspace you do not belong to. |
| 409 | 1409 | `conflict` | Not in a state the action applies to (acknowledging a closed or acknowledged Incident). |
| 422 | 1422 | `validation` | A field was refused; `details.field` names it. |
| 500 | 1500 | `server` | This installation failed. |

The 1.x API families (`/api/v1/*`, `/api/v2/workspaces`, …) answer `410` with
code 1410.

Lists that page put the next cursor in `meta.next_cursor` (null on the last
page). Pass it back as `cursor`. `limit` is 1–200, default 50.

## Routes

| Method and path | Result |
|---|---|
| `GET /version` (no key) | `{version, api: "v3"}` |
| `GET /key` | what this key may do: `{user, access, workspace}`; `access` is `["full"]` or `["read", …actions]`, `workspace` is null on a full key |
| `GET /workspaces` | the Workspaces this key reaches: `[{id, name, role}]` |
| `GET /templates` | published Templates with `fields`, `signals`, `rules` |
| `GET /locations` | `[{id, name}]` |
| `GET /workspaces/{ws}/resources` | `[Resource]` with `open_incident` |
| `POST /workspaces/{ws}/resources` | create from a Template: `{template, key?, name, meta}` → 201, Resource detail |
| `GET /workspaces/{ws}/resources/{id or key}` | Resource detail: `signals`, `rules` (each with `status`, `explanation`, `since`, `open_incident`), `maintenance` |
| `PATCH /workspaces/{ws}/resources/{id or key}` | `{name?, meta?}`; unsent answers stay; key and Template never change |
| `POST /workspaces/{ws}/resources/{r}/observations` | `{signal, state, kind?, value?, labels?, body?, at?, id?}` → 202 `{resource, signal, observation, created_signal}`; the same `id` twice is stored once |
| `GET /workspaces/{ws}/resources/{r}/observations?signal&limit` | newest logged Observations — context, not a decision record |
| `PUT /workspaces/{ws}/resources/{r}/maintenance` | `{minutes}`: hold notifications; judging and history go on |
| `DELETE /workspaces/{ws}/resources/{r}/maintenance` | end it |
| `GET /workspaces/{ws}/incidents` | page of Incidents, newest first; filters `resource`, `rule`, `lifecycle` (open, closed), `confirmation` (confirmed, unconfirmed) |
| `GET /workspaces/{ws}/resources/{r}/incidents` | the same, for one Resource |
| `GET /workspaces/{ws}/incidents/{id}` | Incident with `history`, oldest first |
| `GET /workspaces/{ws}/incidents/{id}/deliveries?limit` | what was sent about it, newest first: `[{at, destination, type, event, status, reason}]`; `status` delivered, failed or held; `reason` a fixed code (below), null when delivered |
| `POST /workspaces/{ws}/incidents/{id}/acknowledge` | take it on; 409 if closed or already taken |

A delivery `reason` is one of `unreachable`, `http_NNN` (the status code the
destination answered), `not_sent` (it could not be prepared), `maintenance`,
`no_destination`, `resource_gone`, `not_announced`. It never quotes the
destination's URL, the body sent, or what the destination answered; the
operator's delivery log in the UI keeps that text.

An Incident: `id`, `resource {id, key, name}`, `rule`
(the Rule identity recorded when it opened), `lifecycle`, `confirmation`,
`condition` (ok, problem, no_data), `verdict`, `explanation`, `closed_reason`
(recovered, rule_removed), `opened_at`, `confirmed_at`, `closed_at`,
`effective_at` (when its latest recorded transition took effect: opened,
confirmed, a verdict change or closed; an acknowledgement does not move it),
`acknowledgement {by, at, via}`. History is
`[{at, kind, condition, verdict, explanation}]`, kinds `opened`, `confirmed`,
`verdict_changed`, `closed`. It is kept after the Rule is edited or removed.

## From a key to an Incident

```bash
API=http://127.0.0.1:8080/api/v3
KEY=...   # User → API keys
H="Authorization: Bearer $KEY"

WS=$(curl -s -H "$H" $API/workspaces | jq -r '.result[0].id')
LOC=$(curl -s -H "$H" $API/locations | jq -r '.result[0].id')

curl -s -H "$H" -X POST $API/workspaces/$WS/resources -d @- <<EOF | jq '.result | {id, key, signals, rules}'
{"template": "website-check", "key": "checkout-api", "name": "Checkout API",
 "meta": {"url": "https://checkout.example.com/health", "locations": ["$LOC"],
          "interval_value": 5, "interval_unit": "MINUTE",
          "failure_mode": "at_least_one", "confirm_after": 0, "recover_after": 0}}
EOF

SIGNAL=$(curl -s -H "$H" $API/workspaces/$WS/resources/checkout-api | jq -r '.result.signals[0].key')
curl -s -H "$H" -X POST $API/workspaces/$WS/resources/checkout-api/observations \
  -d "{\"signal\": \"$SIGNAL\", \"state\": \"problem\", \"labels\": {\"status\": \"503\"}}"

curl -s -H "$H" $API/workspaces/$WS/resources/checkout-api | jq '.result.rules[0]'
INCIDENT=$(curl -s -H "$H" $API/workspaces/$WS/resources/checkout-api | jq -r '.result.rules[0].open_incident')
curl -s -H "$H" $API/workspaces/$WS/incidents/$INCIDENT | jq '.result | {lifecycle, confirmation, condition, history}'
```

## A fleet from one Template

Create a Resource per host from the same Template, then read every open
Incident:

```bash
for n in $(seq -w 1 50); do
  curl -s -H "$H" -X POST $API/workspaces/$WS/resources -d @- <<EOF >/dev/null
{"template": "website-check", "key": "shop-$n", "name": "shop-$n.example.com",
 "meta": {"url": "https://shop-$n.example.com/health", "locations": ["$LOC"],
          "interval_value": 1, "interval_unit": "MINUTE",
          "failure_mode": "majority", "confirm_after": 120, "recover_after": 120}}
EOF
done
curl -s -H "$H" "$API/workspaces/$WS/incidents?lifecycle=open&limit=200" | jq '.result[] | {resource: .resource.key, explanation}'
```

A sender without a person's key can bring a fleet into being from the
Observation address instead: its first report names the Template
(`template_id` and `meta`) and creates the Resource. See the Observation
address in Settings → Observation endpoints.
