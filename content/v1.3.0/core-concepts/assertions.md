---
title: "Expected response"
weight: 20
lede: "How Uptimer decides up vs. down — status codes plus an optional body match."
description: "How pass/fail is determined: status codes and optional body substring."
---

Uptimer has **no assertion language**. A check passes when all of these hold:

1. The request completes — no connection or timeout error.
2. The response **status code is in `response.statuses`** (default `[200]`).
3. *If* `response.body.content` is set, the response body **contains that substring**
   (a plain `contains` — no regex, no JSONPath).

Anything else marks the rule **down**, with a message like
`Unexpected status code 503. Expected statuses are: [200]`.

## Examples

Accept any of several codes:

```json
"response": { "statuses": [200, 201, 204] }
```

Require a keyword in the body:

```json
"response": { "statuses": [200], "body": { "content": "\"status\":\"ok\"" } }
```

## Timeouts & limits

Connection and TLS-handshake timeouts are **10 seconds** each and are not configurable per rule.
There is no per-rule request timeout, no custom request headers, and no latency threshold — an
assertion is status codes plus an optional body substring, nothing more.
