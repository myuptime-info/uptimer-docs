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

Every endpoint needs a Bearer **API key** — a long-lived token minted in the
dashboard (**User → API Keys**):

```sh
curl -H "Authorization: Bearer $UPTIMER_API_KEY" \
  "http://localhost:2517/api/v2/monitoring/websites?workspace_id=<uid>"
```

## Endpoints (v2)

| Method | Path | Purpose |
|---|---|---|
| GET | `/version` | Server version (string). Not versioned — shared by v1 and v2. |
| GET | `/v2/workspaces` | Your workspaces, each with your role. |
| GET | `/v2/locations` | Locations + active worker counts. |
| GET | `/v2/incidents?workspace_id=` | **Open** incidents. Add `&monitor_id=` for one monitor. |
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
  `majority`.

Saving a website monitor also creates its **monitoring subject**, its built-in HTTP
**signal** and its **Reachability rule**. You do not create those separately.

`DELETE` returns `{ "message": "Website monitor deleted successfully", "monitor_id": "<uid>" }`.

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

`GET /v2/incidents` returns **open** incidents only — it answers "what is wrong now".

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

`error_type` is one of `access_denied`, `validation_error`, `not_found`, `forbidden`,
`internal_error`.

Prefer a typed client? See the [Python SDK](/v1.5.0/reference/python-sdk/).
