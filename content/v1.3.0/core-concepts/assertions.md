---
title: "Expected response"
weight: 20
lede: "How Uptimer decides up vs. down."
description: "What makes a check pass or fail."
---

A check passes when three things hold:

1. the request completes — no connection or timeout error,
2. the response **status code** is one you allow (default: `200`), and
3. optionally, the response **body contains** a substring you specify.

Anything else marks the rule **down**. There's no assertion language, no latency threshold and
no header checks — just status codes and an optional body match. Connection and TLS timeouts are
a fixed 10 seconds.

You set the allowed statuses and the optional body match on the rule; the field names are in the
[REST API reference](/v1.3.0/reference/rest-api/).

> The body match is a **literal substring** — it doesn't parse or normalize anything. Matching
> JSON is therefore fragile: `{"ok":true}` won't match `{ "ok": true }` because of the spaces.
> Match a short, stable fragment you know appears verbatim rather than a whole structured payload.
