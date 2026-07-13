---
title: "Rules & checks"
weight: 10
lede: "A rule is one HTTP(S) check: what to request, how often, and what counts as healthy."
description: "The rule model — request, interval, expected response."
---

A **rule** is the unit you monitor. It has three parts: a **request** (what to call), an
**interval** (how often), and an [expected response](/v1.3.0/core-concepts/assertions/) (what
"up" means). Uptimer runs the request on the interval and records up or down.

> Checks are **HTTP and HTTPS only** in this release — there is no TCP, DNS, ping or keyword
> check type. HTTPS is simply an `https://` URL through the same path.

## Anatomy of a rule

| Field | Type | Notes |
|---|---|---|
| `name` | string | Human label. |
| `interval` | int (seconds) | Whole minutes — divisible by 60, minimum 60. |
| `request.url` | string | Target URL (`http://` or `https://`). |
| `request.method` | enum | `GET`, `POST`, `PATCH`, `OPTIONS`. |
| `request.content_type` | string | Defaults to `application/json` when a body is sent. |
| `request.data` | string | Optional request body. |
| `response.statuses` | int[] | Status codes that count as up (default `[200]`). |
| `response.body.content` | string | Optional substring the body must contain. |

## How often it runs

`interval` is in seconds but must be whole minutes (`60`, `120`, `300`, …). The scheduler ticks
once a minute, so **one minute is the finest resolution** — a smaller interval can't make a check
run more often.

## Creating a rule

Rules are created in the dashboard or through the [REST API](/v1.3.0/reference/rest-api/) — the
dashboard is just an API client. A minimal rule:

```json
{
  "name": "home",
  "interval": 60,
  "workspace_id": "<workspace-uid>",
  "request":  { "url": "https://example.com", "method": "GET" },
  "response": { "statuses": [200] }
}
```

Next: [Expected response](/v1.3.0/core-concepts/assertions/) for how up/down is decided, and
[Regions](/v1.3.0/core-concepts/regions/) for where checks run from.
