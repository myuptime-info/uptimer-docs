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
days** — see [API keys](/v1.5.0/operating/authentication/#api-keys-rest-api) for
rotation. A key can only reach the workspaces its owner is a member of; anything
else answers `Access denied`.

## Endpoints (v2)

| Method | Path | Purpose |
|---|---|---|
| GET | `/version` | Server version (string). Needs a token like everything else, but is **not versioned** — shared by v1 and v2, so a client can read it before it knows which API versions the server has. |
| GET | `/v2/workspaces` | Your workspaces, each with your role. |
| GET | `/v2/locations` | Locations + active worker counts. |
| GET | `/v2/incidents?workspace_id=` | **Open** incidents, newest trouble first. Add `&monitor_id=` for one monitor. |
| GET | `/v2/monitoring/websites?workspace_id=` | List website monitors. |
| POST | `/v2/monitoring/websites` | Create a website monitor. |
| GET | `/v2/monitoring/websites/{id}` | Get one. |
| POST | `/v2/monitoring/websites/{id}` | Update one (there is no `PUT`). |
| DELETE | `/v2/monitoring/websites/{id}` | Delete one. |

Website monitoring is a built-in **template**, which is why its resource sits under
`/v2/monitoring/` rather than at `/v2/monitors`. That name is reserved for the
general model.

## Endpoints (v1, frozen)

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/workspaces` | Your workspaces, each with your role. |
| GET | `/v1/rules?workspace_id=` | List rules in a workspace. |
| POST | `/v1/rules` | Create a rule. |
| GET | `/v1/rules/{uid}` | Get one rule. |
| POST | `/v1/rules/{uid}` | Update a rule. |
| DELETE | `/v1/rules/{uid}` | Delete a rule. |
| GET | `/v1/regions` | List regions + active worker counts. |

## Website monitor payload (v2)

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
- `interval` is seconds, in whole minutes (≥ 60).
- `locations` is a list of location **names** (as listed by `GET /v2/locations`). An
  unknown name is a validation error. Omit or leave it empty for **no location** — the
  monitor is then never checked and stays at no data, see
  [Locations](/v1.5.0/core-concepts/locations/). On update the list **replaces** the
  monitor's locations, so include the ones you want to keep.
- `agreement` is how many locations must report a problem before the monitor does:
  `any`, `majority` or `all`. Omit it to keep the stored value — on create that is
  `majority`. Any other value is refused with `invalid agreement` **before anything is
  written**.
- `name`, `interval`, `request.url`, `request.method` and `response.statuses` are
  required. `workspace_id` is required on create and ignored on update: a monitor
  cannot change workspace.
- `body.content` is an optional literal substring the response must contain; empty
  means "don't check the body".

The response is the stored monitor: the same fields plus `id`, and a `kind` on every
object (`website_monitor`, `website_monitor_request`, `website_monitor_response`,
`website_monitor_response_body`). `kind` is the server telling you what an object is —
you never send it back, and it is ignored if you do. `locations` always comes back as a
list, never `null`.

Saving a website monitor also creates its **monitoring subject**, its built-in HTTP
**signal** and its **Reachability rule**. You do not create those separately. `DELETE`
removes all of them and returns
`{ "message": "Website monitor deleted successfully", "monitor_id": "<uid>" }`.

## Incident payload (v2)

```json
{
  "id": "v8dLj9O1tzs",
  "monitor_id": "<uid>",
  "monitor_name": "home",
  "status": "problem",
  "trouble_since": "2026-08-20T18:21:37Z",
  "confirmed_at": "2026-08-20T18:24:37Z",
  "well_since": null,
  "locations": { "failing": ["local"], "unknown": [], "ok": [] }
}
```

`GET /v2/incidents` returns **open** incidents only, newest `trouble_since` first — it
answers "what is wrong now". Closed incidents are history and live on the subject
timeline in the dashboard; there is no incident-history endpoint in this release. A
monitor that has never been evaluated has nothing open and simply does not appear.

- `id` is an **opaque id**, not a database number. It is derived from
  [`server.sqids_salt`](/v1.5.0/operating/configuration/) — change that value and
  previously-returned ids no longer resolve.
- `confirmed_at` is `null` while the incident is `pending`: the confirm hold gates the
  notification, not the incident.
- `well_since` is `null` unless the incident is `recovering`.
- Every incident object also carries `"kind": "incident"`.

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

## Rule payload (v1, frozen)

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

Same rules as v2's payload, with `regions` in place of `locations`. v1 has no
`agreement` field: a rule created through v1 uses the default, `majority`.

`DELETE` returns `{ "message": "Rule deleted successfully", "rule_id": "<uid>" }`.

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

Prefer a typed client? See the [Python SDK](/v1.5.0/reference/python-sdk/).
