---
title: "Webhooks"
weight: 20
lede: "The workspace webhook is a plain HTTP POST — any receiver that accepts the payload works."
description: "The workspace webhook payload and its limits."
---

The workspace [alert webhook](/v1.3.0/alerting/slack-alerts/) is just an HTTP `POST` with a
Slack-style JSON body. Any endpoint that accepts that shape works — a Slack incoming webhook, a
relay, or your own service.

## Payload

On a status change Uptimer POSTs:

```json
{
  "attachments": [
    {
      "color": "#d50201",
      "title": "your rule name",
      "text": "…status message…",
      "footer": "Uptimer"
    }
  ]
}
```

Colours: recovered `#2eb887` (green), down `#d50201` (red), no-data grey.

> This release has **one Slack-compatible webhook per workspace** — no per-rule routing, no
> custom templates or headers, no retries, and no other channels (email/SMS). If you need
> fan-out or a different format, point the webhook at a small relay you control.
