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
| `GET /templates` | the system Templates with `fields`, `signals`, `rules` |
| `GET /locations` | `[{id, name}]` |
| `GET /workspaces/{ws}/templates` | the system Templates, then this Workspace's own, every revision (`id` is `key@version`); each Rule carries its `action` |
| `POST /workspaces/{ws}/templates` | publish a pushed-data Template revision (below) → 201; 409 if this key and version exist; editor or owner, full key |
| `GET /workspaces/{ws}/resources` | page of Resources by id, with `open_incident` and `archived_at`; `state` active (default), archived or all; `template`; `meta.<field>=<value>` (below); `limit` 1–200, `cursor` |
| `POST /workspaces/{ws}/resources` | create from a Template: `{template, key?, name, meta}` → 201, Resource detail. `template` is a key (its newest revision) or `key@version` |
| `GET /workspaces/{ws}/resources/{id or key}` | Resource detail: `signals`, `rules` (each with `status`, `explanation`, `since`, `open_incident`, `action`), `maintenance` |
| `PATCH /workspaces/{ws}/resources/{id or key}` | `{name?, meta?}`; unsent answers stay; key and Template never change |
| `POST /workspaces/{ws}/resources/{id or key}/archive` | retire it from the inventory → 200, Resource detail with `archived_at`; 409 if already archived; editor or owner, full key |
| `POST /workspaces/{ws}/resources/{r}/observations` | `{signal, state, kind?, value?, labels?, body?, at?, id?}` → 202 `{resource, signal, observation, created_signal}`; `state` is ok, problem or no_data (no evidence this time; never health); the same `id` twice is stored once |
| `GET /workspaces/{ws}/resources/{r}/observations?signal&limit` | newest logged Observations — context, not a decision record |
| `PUT /workspaces/{ws}/resources/{r}/maintenance` | `{minutes}`: hold notifications; judging and history go on |
| `DELETE /workspaces/{ws}/resources/{r}/maintenance` | end it |
| `GET /workspaces/{ws}/incidents` | page of Incidents, newest first; filters `resource`, `rule`, `lifecycle` (open, closed), `confirmation` (confirmed, unconfirmed), and the Resources' `template`, `resource_state` (all by default, active, archived) and `meta.<field>` |
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
`acknowledgement {by, at, via}`, and `action` (what its Rule told a person to
do when it opened, or null). History is
`[{at, kind, condition, verdict, explanation}]`, kinds `opened`, `confirmed`,
`verdict_changed`, `closed`. It is kept after the Rule is edited or removed.

## Archive and filters

Archiving retires a Resource that left the inventory. It is not a deletion:
the Resource keeps its id, key, Template revision, metadata and history, and
stays readable by id or key. It leaves the active list, its open Incidents
close with `closed_reason` `resource_archived` (never a recovery, never
announced as one), and it takes no more Observations (422 on `resource`, on
API v3 and on the Observation address), edits, maintenance or checks (409).
Its key stays reserved: no new Resource can take it. There is no restore.
A write already holding the Resource when the archive arrives commits first;
anything later is refused, and a worker's report for it is dropped — no
Observation is stored after the archive.

Resource and Incident lists take a bounded filter: `template` (a Template
key, any revision) and up to five `meta.<field>=<value>` equalities on that
Template's single-valued fields (string, enum, url, integer, number,
duration, boolean). The value is read as the field's type, so
`meta.ratio_threshold=0.40` matches `0.4`. A field filter without
`template`, an unknown field, a list field or a value the field cannot hold is
422. An Incident filter may match at most 5000 Resources. Every list stays
inside the Workspace the key reaches, and pages by a stable cursor.

## Pushed-data Templates

A Workspace editor publishes a Template for evidence its own systems push: no
URL, no Locations, no managed worker. A revision
never changes; publish the next `version` to change it. Resources keep the
revision they were created from.

```json
{"key": "fleet-triage", "version": 1, "name": "…", "summary": "…",
 "fields":  [{"key": "ratio_threshold", "label": "…", "type": "number", "default": 0.5, "min": 0}],
 "signals": [{"key": "region_a", "kind": "heartbeat", "every_seconds": 300}, …],
 "rules":   [{"key": "banned", "action": "Replace the server.",
              "wait": {"confirm_after": 600, "recover_after": 600},
              "decision": {"all": [
                {"signal": "region_a", "field": "status", "operator": "eq", "operand": "problem"},
                {"signal": "traffic_ratio", "field": "value", "operator": "lt",
                 "operand": {"meta": "ratio_threshold"}}]}}]}
```

- Fields: `string`, `integer`, `number`, `boolean`, `enum` (`options`),
  `duration_seconds`, `string_list`, `integer_list`; `required`, `default`,
  `min`, `max`. No `url` or `location_list`.
- Signals: `kind` heartbeat, periodic or event. `every_seconds` (10–86400) is
  how often the sender pushes; a heartbeat silent for three of those is
  unresolved.
- Rules are composite: `decision` is one node — `all`
  (2+), `any` (2+), `not`, or a comparison on one of this Resource's Signals:
  `status` with `eq`/`neq` and `ok` or `problem`, or `value` with `eq`, `neq`,
  `gt`, `gte`, `lt`, `lte` and a number or `{"meta": field}`. At most 4 deep
  and 16 comparisons. `wait` holds are seconds or `{"meta": field}`. `action`
  (1–200 characters) is written on the Rule's Incidents and alerts.
- A `value` comparison may add `"min_count": N, "within_seconds": S`
  (N 1–100, S 60–86400). It judges the latest N distinct Observations of that
  Signal from the last S seconds (by time, then by stored identity): true if
  all N are numbers that satisfy it, false if all N are numbers that fail it,
  unknown if they are mixed, fewer than N, or include a missing value or
  `no_data`. Opposing comparisons on the same Signal read the same set, so
  they never both hold: three low then three high readings is the high side;
  interleaved readings are neither. Duplicate submissions and re-evaluation
  add no reading; older readings leave the window. The Rule's
  `confirm_after` and `recover_after` apply after this count.
- Unknown is three-valued: a Signal that never reported, went quiet, said
  `no_data` (whatever value it also carries), or carried no value cannot
  satisfy its own comparison. `not`
  unknown is unknown; `all` is false once anything is false; `any` is true
  once anything is true. An unknown result neither opens, confirms nor closes
  an Incident.
- At most 32 fields, 16 signals, 10 rules. Unknown keys are refused (400);
  an invalid definition is 422 and stores nothing.

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
