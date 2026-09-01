---
title: "REST API"
weight: 10
lede: "The API the dashboard is built on. Base /api, always HTTP 200, envelope responses."
description: "REST API reference — endpoints, auth, schemas, errors."
---

Base URL: **`http://<host>:2517/api`** — the API is served under `/api` on the web UI port.

## Conventions

- **Every response is HTTP `200`** with a `{ "result", "error", "meta" }` envelope — check
  `error`, not the status code.
- On success `error` is `null` and `result` holds the data; on failure `result` is `null` and
  `error` is filled.
- Objects carry a `kind` field (`website_monitor`, `workspace`, `location`, …).

## Two versions

**v2 is the current API** and uses the product's language: *locations*, *website
monitoring*, *incidents*. It is self-contained — a v2 client never needs a v1 route.

**v1 is frozen and still supported.** Every v1 route, field and `kind` is unchanged,
so existing clients keep working with no modification. v1 says *regions* and *rules*
where v2 says *locations* and *website monitors*; the underlying objects are the same.

New integrations should use v2.

## Auth

**Every endpoint needs a Bearer API key** — a token minted in the dashboard
(**User → API Keys**). That includes `GET /version`: a request with no
`Authorization` header answers `Missing Authorization header` (code `1001`), never a
version.

```sh
curl -H "Authorization: Bearer $UPTIMER_API_KEY" \
  "http://localhost:2517/api/v2/monitoring/websites?workspace_id=<uid>"
```

The token is shown **once**, on the screen that creates it, and is valid for **180
days** — see [API keys](/v1.6.0/operating/authentication/#api-keys-rest-api) for
rotation. A key can only reach the workspaces its owner is a member of; anything
else answers `Access denied`.

## Endpoints (v2)

Every row links to that method's own section.

| Method | Path | Purpose |
|---|---|---|
| GET | [`/version`](#get-the-server-version) | Server version (string). Shared by v1 and v2. |
| GET | [`/v2/workspaces`](#list-workspaces-v2) | Your workspaces, each with your role. |
| GET | [`/v2/locations`](#list-locations) | Locations + active worker counts. |
| GET | [`/v2/incidents`](#list-open-incidents) | **Open** incidents, newest trouble first. |
| GET | [`/v2/monitoring/websites`](#list-website-monitors) | List website monitors. |
| POST | [`/v2/monitoring/websites`](#create-a-website-monitor) | Create a website monitor. |
| GET | [`/v2/monitoring/websites/{id}`](#get-a-website-monitor) | Get one. |
| POST | [`/v2/monitoring/websites/{id}`](#update-a-website-monitor) | Update one (there is no `PUT`). |
| DELETE | [`/v2/monitoring/websites/{id}`](#delete-a-website-monitor) | Delete one. |
| POST | [`/v2/subjects/{subject}/signals/{signal}/observations`](#report-an-observation) | Report one observation to a custom signal. |

Website monitoring is a built-in **template**, which is why its resource sits under
`/v2/monitoring/` rather than at `/v2/monitors`. That name is reserved for the
general model.

## Endpoints (v1, frozen)

| Method | Path | Purpose |
|---|---|---|
| GET | [`/v1/workspaces`](#list-workspaces-v1) | Your workspaces, each with your role. |
| GET | [`/v1/rules`](#list-rules) | List rules in a workspace. |
| POST | [`/v1/rules`](#create-a-rule) | Create a rule. |
| GET | [`/v1/rules/{uid}`](#get-a-rule) | Get one rule. |
| POST | [`/v1/rules/{uid}`](#update-a-rule) | Update a rule. |
| DELETE | [`/v1/rules/{uid}`](#delete-a-rule) | Delete a rule. |
| GET | [`/v1/regions`](#list-regions) | List regions + active worker counts. |

## Shared payloads

Three schemas are referenced by more than one method, so they are written once here.

### Website monitor object (v2)

```json
{
  "name": "home",
  "interval": 60,
  "workspace_id": "<uid>",
  "request":  { "url": "https://example.com", "method": "GET", "content_type": "application/json", "data": "" },
  "response": { "statuses": [200], "body": { "content": "" } },
  "locations": ["local"],
  "agreement": "majority"
}
```

- `method` is one of `GET`, `POST`, `PATCH`, `OPTIONS`.
- `interval` is seconds, in whole minutes (≥ 60) — anything not divisible by 60 is a
  validation error.
- `locations` is a list of location **names** (as listed by
  [`GET /v2/locations`](#list-locations)). An unknown name is a validation error. Omit
  or leave it empty for **no location** — the monitor is then never checked and stays
  at no data, see [Locations](/v1.6.0/core-concepts/locations/).
- `agreement` is how many locations must report a problem before the monitor does:
  `any`, `majority` or `all`. Any other value is refused with `invalid agreement`
  **before anything is written**.
- `name`, `interval`, `request.url`, `request.method` and `response.statuses` are
  required. An empty `content_type` is stored as `application/json`.
- `body.content` is an optional literal substring the response must contain; empty
  means "don't check the body".

The response is the stored monitor: the same fields plus `id`, and a `kind` on every
object (`website_monitor`, `website_monitor_request`, `website_monitor_response`,
`website_monitor_response_body`). `kind` is the server telling you what an object is —
you never send it back, and it is ignored if you do. `locations` always comes back as a
list, never `null`.

### Incident object (v2)

```json
{
  "id": "v8dLj9O1tzs",
  "monitor_id": "<uid>",
  "monitor_name": "home",
  "status": "problem",
  "trouble_since": "2026-08-20T18:21:37Z",
  "confirmed_at": "2026-08-20T18:24:37Z",
  "well_since": null,
  "locations": { "failing": ["local"], "unknown": [], "ok": [] },
  "kind": "incident"
}
```

- `id` is an **opaque id**, not a database number. It is derived from
  [`server.sqids_salt`](/v1.6.0/operating/configuration/) — change that value and
  previously-returned ids no longer resolve.
- `trouble_since` is the first non-ok tick: the incident's real start.
- `confirmed_at` is `null` while the incident is `pending` — the confirm hold gates the
  notification, not the incident.
- `well_since` is `null` unless the incident is `recovering`.

`status` uses the same words the dashboard shows, so the API and the screen cannot
disagree:

| status | meaning |
|---|---|
| `problem` | confirmed; notifications have gone out |
| `pending` | failing, but inside the confirm hold — **nobody has been notified yet** |
| `recovering` | reporting ok again while the incident is still open |
| `no_data` | nothing usable arrived |
| `ok` | healthy |

`locations` is the evidence the verdict came from. A location that has never reported
stays in `unknown` and still counts toward the agreement — that is a real state, not a
missing one.

### Observation object (v2)

What the server stored, returned by [report an observation](#report-an-observation).

```json
{
  "subject_id": "check-8f3c1a2b",
  "signal_id": "worker-pulse",
  "observed_at": "2026-09-01T12:00:00Z",
  "received_at": "2026-09-01T12:00:01Z",
  "status": "ok",
  "value": 1.5,
  "error": "",
  "labels": { "instance": "worker-3" },
  "accepted": true,
  "reject_reason": "accepted",
  "kind": "observation"
}
```

| Field | Meaning |
|---|---|
| `subject_id`, `signal_id` | The two slugs you addressed, echoed back. |
| `observed_at` | When **you** say you observed it. Omitted on the request, the server stamps now. |
| `received_at` | When the server stored it. The pair explains a late or skewed report. |
| `status` | `ok` or `problem`, as sent. |
| `value` | The optional number, or `null`. |
| `labels` | Your labels, as sent. |
| `accepted` | Whether evaluation may use this row. |
| `reject_reason` | `accepted`, or why not: `clock_skew`, `late`, `out_of_order`, `out_of_retention`. |

`accepted` reports **acceptance, not health**: it says Uptimer stored the observation and may
evaluate it, not that anything is fine or broken. Whether a `problem` raises an incident is
decided by a [rule](/v1.6.0/core-concepts/signals-and-rules/#rules), and a signal no rule reads
raises nothing at all.

### Rule object (v1, frozen)

```json
{
  "name": "home",
  "interval": 60,
  "workspace_id": "<uid>",
  "request":  { "url": "https://example.com", "method": "GET", "content_type": "application/json", "data": "" },
  "response": { "statuses": [200], "body": { "content": "" } },
  "regions":  ["local"]
}
```

Same field rules as the [website monitor object](#website-monitor-object-v2), with
`regions` in place of `locations`. v1 has no `agreement` field: a rule created through
v1 uses the default, `majority`.

The response adds `id` and carries the v1 kinds — `rule`, `rule_request`,
`rule_response`, `rule_response_body`.

## v2 methods

### Get the server version

**`GET /version`**

No parameters, no body. `result` is a plain JSON string:

```json
{ "result": "1.6.0", "error": null, "meta": null }
```

Not versioned — it is shared by v1 and v2, so a client can read it before it knows
which API versions the server has. It still needs a Bearer token like every other
endpoint. It is the one route registered outside the API-key lookup: the token is
validated, but the key record behind it is not loaded.

### List workspaces (v2)

**`GET /v2/workspaces`**

No parameters, no body. Returns every workspace the key's owner is a member of, each
with that member's role:

```json
[{ "id": "<uid>", "name": "Default", "role": "owner", "kind": "workspace" }]
```

`role` is `owner`, `editor` or `viewer`. This is a path alias over the v1 handler — its
payload is already in v2's vocabulary — so a v2 client never has to call `/v1`.

### List locations

**`GET /v2/locations`**

No parameters, no body. Returns every location on the instance with how many workers
are currently serving it:

```json
[{ "id": "<uid>", "name": "eu-west", "active_workers_count": 0, "kind": "location" }]
```

Use `name` when assigning locations to a monitor — the create and update payloads match
by name, not by id. `active_workers_count` is `0` for a location no worker is serving;
a monitor assigned only to such a location has nothing reporting for it.

### List open incidents

**`GET /v2/incidents?workspace_id=<uid>`**

| Parameter | Required | Meaning |
|---|---|---|
| `workspace_id` | yes | The workspace to read. Missing → `Missing workspace ID` (code `2004`). |
| `monitor_id` | no | Narrow the answer to one website monitor. |

Returns a list of [incident objects](#incident-object-v2), newest `trouble_since`
first — it answers "what is wrong now".

**Open incidents only.** Closed incidents are history and live on the subject timeline
in the dashboard; there is no incident-history endpoint in this release. A monitor that
has never been evaluated has nothing open and simply does not appear, and a workspace
with nothing wrong answers `[]`.

A key whose owner is not a member of that workspace gets `Access denied` (code `2005`).

### List website monitors

**`GET /v2/monitoring/websites?workspace_id=<uid>`**

| Parameter | Required | Meaning |
|---|---|---|
| `workspace_id` | yes | The workspace to read. Missing → `Missing workspace ID` (code `2004`). |

Returns a list of stored [website monitor objects](#website-monitor-object-v2), each
with its `id`, its `locations` and its `agreement`. A non-member gets `Access denied`
(code `2005`).

### Create a website monitor

**`POST /v2/monitoring/websites`**

Body: a [website monitor object](#website-monitor-object-v2) without `id`.

- `workspace_id` is **required** — it is what decides where the monitor is created.
- `locations` assigns the monitor; omit it for none, and it is never checked.
- `agreement` is optional. Omitted, it is created with the default `majority`, which is
  what the dashboard form pre-selects.

Returns the stored monitor, so the `id` to address it with comes back in the response.

Saving a website monitor also creates its **monitoring subject**, its built-in HTTP
**signal** and its **Reachability rule** — you do not create those separately, and they
are in place before the response is written, so a monitor created here behaves exactly
like one created in the form.

An unknown location name answers `invalid locations` / `Unknown location: "…"` (code
`2001`), and nothing is written.

### Get a website monitor

**`GET /v2/monitoring/websites/{id}`**

`{id}` is the monitor's `id`, as returned by
[create](#create-a-website-monitor) or [list](#list-website-monitors). No body.

Returns one stored [website monitor object](#website-monitor-object-v2). An id that
does not exist, or one in a workspace the key cannot reach, answers
`Website monitor not found` (code `2002`) — the two are deliberately indistinguishable.

### Update a website monitor

**`POST /v2/monitoring/websites/{id}`** — there is no `PUT`.

Body: a [website monitor object](#website-monitor-object-v2) without `id`. The update
is a **full replacement**, not a patch: send the whole configuration, because anything
you leave out is not kept.

Three fields behave differently from create:

- `workspace_id` is **ignored**. A monitor cannot change workspace.
- `locations` **replaces** the stored list, so include the ones you want to keep.
  Omitting it, or sending `[]`, clears them and the monitor stops being checked.
- `agreement` **omitted keeps the stored value** — an update that does not mention it
  will not silently reset it to `majority`.

Returns the stored monitor. An id that does not exist answers `Website monitor not
found` (code `2002`).

### Delete a website monitor

**`DELETE /v2/monitoring/websites/{id}`**

No body. Requires an **editor or owner** role in the monitor's workspace; a viewer gets
`Access denied` (code `2005`).

```json
{ "message": "Website monitor deleted successfully", "monitor_id": "<uid>" }
```

This removes the monitor **and everything under it** — its monitoring subject, its
signal, its rule and their history. Deleting an id that is already gone answers
`Website monitor not found` (code `2002`).

### Report an observation

**`POST /v2/subjects/{subject_slug}/signals/{signal_slug}/observations`**

Reports one observation to a **custom heartbeat or event** signal. Both slugs are shown on the
signal's page in the dashboard.

| Field | Required | Meaning |
|---|---|---|
| `status` | yes | `ok` or `problem`. |
| `observed_at` | no | RFC 3339, e.g. `2026-09-01T12:00:00Z`. Omit to mean now. |
| `value` | no | A number a rule can compare with `<` or `>`. |
| `error` | no | Your own error text, for a problem worth explaining. |
| `labels` | no | An open string map that rules match on. |

```sh
curl -X POST "$UPTIMER_URL/api/v2/subjects/check-8f3c1a2b/signals/worker-pulse/observations"   -H "Authorization: Bearer $UPTIMER_TOKEN"   -H "Content-Type: application/json"   -d '{"status":"ok","value":1.5,"labels":{"instance":"worker-3"}}'
```

Returns the stored [observation object](#observation-object-v2).

**A stored observation the engine will not evaluate is returned, not refused.** A timestamp far
in the future comes back with `accepted: false` and `reject_reason: "clock_skew"` — it was
received and kept. An error means nothing was stored.

Refusals, all of which store nothing:

| Answer | When |
|---|---|
| `invalid status` (code `2001`) | `status` missing, or not `ok`/`problem`. |
| `invalid observed_at` (code `2001`) | Not an RFC 3339 timestamp. |
| `invalid label` (code `2001`) | An empty label key, or a key/value over its length limit. |
| `Signal not found` (code `2002`) | No signal with that slug on the subject. |
| `Subject not found` (code `2002`) | No subject with that slug in a workspace you belong to — the same answer a subject you cannot see gives. |
| `Signal does not accept posted observations` (code `2003`) | The signal is **platform HTTP**. Its stream belongs to Uptimer's own probe, so a posted claim is never mixed in with a measurement. |

The workspace comes from your token's membership, not the path: a subject slug is unique per
workspace, not globally. If the same slug exists in two of your workspaces the answer is
`Ambiguous subject` (code `2004`), naming them — add `?workspace_id=<uid>` to choose.

Reporting requires the workspace **editor** role; a viewer gets `Access denied` (code `2005`).

Retries are safe: an observation is identified by its signal, `observed_at` and labels, so
re-sending the same one replaces it rather than counting twice.

## v1 methods (frozen)

These routes, fields and kinds are unchanged from earlier releases and stay supported.
New integrations should use the [v2 methods](#v2-methods) above.

### List workspaces (v1)

**`GET /v1/workspaces`**

No parameters, no body. Identical to
[`GET /v2/workspaces`](#list-workspaces-v2) — same handler, same payload:

```json
[{ "id": "<uid>", "name": "Default", "role": "owner", "kind": "workspace" }]
```

### List rules

**`GET /v1/rules?workspace_id=<uid>`**

| Parameter | Required | Meaning |
|---|---|---|
| `workspace_id` | yes | The workspace to read. Missing → `Missing workspace ID` (code `2004`). |

Returns a list of stored [rule objects](#rule-object-v1-frozen). A workspace id that
does not exist answers `Workspace not found` (code `2002`); one the key's owner is not
a member of answers `Access denied` (code `2005`).

The v2 equivalent is [`GET /v2/monitoring/websites`](#list-website-monitors), which
returns the same rules with `locations` and an `agreement`.

### Create a rule

**`POST /v1/rules`**

Body: a [rule object](#rule-object-v1-frozen) without `id`. `workspace_id` is required.

`regions` takes region **names**, matched as v2 matches location names; an unknown name
answers `invalid regions` / `Unknown region: "nope"` (code `2001`). Omit it and the rule
is created with none, which leaves it at "No Data".

There is no `agreement` field in v1. A rule created here uses the default agreement,
`majority`, and you change it from the dashboard or through
[`POST /v2/monitoring/websites/{id}`](#update-a-website-monitor).

Returns the stored rule, including its new `id`.

### Get a rule

**`GET /v1/rules/{uid}`**

`{uid}` is the rule's `id`. No body. Returns one stored
[rule object](#rule-object-v1-frozen).

A uid that does not exist, or one the key cannot reach, answers `Rule not found` /
`Rule does not exist or access denied` (code `2002`).

### Update a rule

**`POST /v1/rules/{uid}`** — there is no `PUT`.

Body: a [rule object](#rule-object-v1-frozen) without `id` or `workspace_id`. Like v2,
this is a **full replacement**.

> **Omitting `regions` clears them.** An update that does not carry the field leaves the
> rule assigned to no region, and it stops being checked until you assign one again.
> Send the full list you want to keep.

A uid that does not exist answers `Rule not found` / `Rule does not exist` (code
`2002`). Returns the stored rule.

### Delete a rule

**`DELETE /v1/rules/{uid}`**

No body. Requires an **editor or owner** role in the rule's workspace; a viewer gets
`Access denied` (code `2005`).

```json
{ "message": "Rule deleted successfully", "rule_id": "<uid>" }
```

As with [the v2 delete](#delete-a-website-monitor), this removes the rule and the
subject, signal and history that belong to it. Deleting a uid that is already gone
answers `Rule not found` (code `2002`).

### List regions

**`GET /v1/regions`**

No parameters, no body. The v1 name for what v2 calls
[locations](#list-locations) — the same instance-wide list, with the same active-worker
counts, under the v1 `kind`:

```json
[{ "id": "<uid>", "name": "eu-west", "active_workers_count": 0, "kind": "region" }]
```

## Errors

```json
{ "result": null,
  "error": { "code": 2001, "error_type": "validation_error", "message": "…", "details": "…" },
  "meta": null }
```

**Branch on `code`, not on `error_type`.** `code` is stable and specific:

| code | Meaning |
|---|---|
| `1001`–`1007` | Auth: missing, malformed, invalid or expired token. |
| `2001` | Validation error. |
| `2002` | Not found. |
| `2003` | Forbidden. |
| `2004` | Invalid request — a required query parameter is missing. |
| `2005` | Access denied — the key's owner is not a member of that workspace. |
| `2006` | Malformed JSON. |
| `500` | Internal error. |

`error_type` is one of `access_denied`, `validation_error`, `not_found`, `forbidden`,
`internal_error`, but it is **coarser than the code**: only `2001`, `2002`, `2003` and
the `1xxx` auth codes map to their own type — `2004`, `2005`, `2006` and `500` all
report `internal_error`. That is a v1 quirk, and v2 inherits it deliberately rather
than making the two versions disagree about the envelope.

v2 speaks v2's words in errors too: an unknown location name answers
`invalid locations` / `Unknown location: "…"`, never "region".

Prefer a typed client? See the [Python SDK](/v1.6.0/reference/python-sdk/).
