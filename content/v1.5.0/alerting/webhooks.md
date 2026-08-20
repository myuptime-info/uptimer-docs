---
title: "Webhooks"
weight: 20
lede: "The workspace webhook is a plain HTTP POST — any receiver that accepts the payload works."
description: "The workspace webhook payload and its limits."
---

The workspace [alert webhook](/v1.5.0/alerting/slack-alerts/) is just an HTTP `POST` with a
Slack-style JSON body. Any endpoint that accepts that shape works — a Slack incoming webhook, a
relay, or your own service.

## Payload

When an incident is confirmed or closes, Uptimer POSTs:

```json
{
  "attachments": [
    {
      "author_name": "Uptimer",
      "title": "Checkout API is down",
      "color": "#d50201",
      "text": "Failing from 2 of 3 locations — de, fr\n`dial tcp 104.20.23.154:9: i/o timeout`\nDown for 2m before we alerted.\n<https://uptimer.example.com/ui/workspace/…/rule/…/history|View timeline>",
      "footer": "Uptimer",
      "timestamp": 1786642711
    }
  ]
}
```

The title is the monitor name plus its state, and the colour follows it:

| Alert | Title | Colour |
|---|---|---|
| Confirmed problem | `{monitor} is down` | `#d50201` red |
| Confirmed no data | `{monitor} — no data` | `#f0ad4e` amber |
| Recovered | `{monitor} is back up` | `#2eb887` green |

The `text` is plain text with Slack's `<url|label>` link syntax, so a non-Slack consumer should
expect that markup rather than HTML or Markdown.

> This release has **one Slack-compatible webhook per workspace** — no per-rule routing, no
> custom templates or headers, no retries, and no other channels (email/SMS). If you need
> fan-out or a different format, point the webhook at a small relay you control.
