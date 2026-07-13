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
- Objects carry a `kind` field (`rule`, `workspace`, `region`, …).

## Auth

Every endpoint except `/version` needs a Bearer **API key** — a long-lived token minted in the
dashboard (**Settings → API Keys**):

```sh
curl -H "Authorization: Bearer $UPTIMER_API_KEY" \
  "http://localhost:2517/api/v1/rules?workspace_id=<uid>"
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/version` | Server version (string). Public. |
| GET | `/v1/workspaces` | Your workspaces, each with your role. |
| GET | `/v1/rules?workspace_id=` | List rules in a workspace. |
| POST | `/v1/rules` | Create a rule. |
| GET | `/v1/rules/{uid}` | Get one rule. |
| POST | `/v1/rules/{uid}` | Update a rule (there is no `PUT`). |
| DELETE | `/v1/rules/{uid}` | Delete a rule. |
| GET | `/v1/regions` | List regions + active worker counts. |

## Rule payload

```json
{
  "name": "home",
  "interval": 60,
  "workspace_id": "<uid>",
  "request":  { "url": "https://example.com", "method": "GET", "content_type": "application/json", "data": "" },
  "response": { "statuses": [200], "body": { "content": "" } }
}
```

- `method` is one of `GET`, `POST`, `PATCH`, `OPTIONS`.
- `interval` is seconds, in whole minutes (≥ 60).
- Region assignment via the API isn't available yet — see [Regions](/v1.3.0/core-concepts/regions/).

`DELETE` returns `{ "message": "Rule deleted successfully", "rule_id": "<uid>" }`.

## Errors

```json
{ "result": null,
  "error": { "code": 2001, "error_type": "validation_error", "message": "…", "details": "…" },
  "meta": null }
```

`error_type` is one of `access_denied`, `validation_error`, `not_found`, `forbidden`,
`internal_error`.

Prefer a typed client? See the [Python SDK](/v1.3.0/reference/python-sdk/).
