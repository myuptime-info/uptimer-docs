---
title: "Webhooks"
weight: 60
lede: "A webhook destination is a plain HTTP POST — any receiver that accepts the payload works."
description: "The built-in webhook payload, and how to change its shape."
---

A **webhook** [destination](/v1.8.0/alerting/destinations/) is an HTTP `POST` with a Slack-style
JSON body. Any endpoint that accepts that shape works — a Slack incoming webhook, a relay, or your
own service. To send a **different** shape, attach a
[transformation](/v1.8.0/alerting/transformations/).

## The built-in payload

When an incident is confirmed, when a
[reminder](/v1.8.0/core-concepts/monitors-and-incidents/#reminders-a-problem-nobody-has-answered-says-so-again)
about it comes due, and when it closes, Uptimer POSTs:

```json
{
  "attachments": [
    {
      "author_name": "Uptimer",
      "title": "Checkout API is down",
      "color": "#d50201",
      "text": "Failing from 2 of 3 locations — de, fr\n`dial tcp 104.20.23.154:9: i/o timeout`\nDown for 2m before we alerted.\n<https://uptimer.example.com/ui/workspace/{workspace}/monitoring/subject/{subject}|View timeline>",
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

A four-hour reminder about a problem nobody has answered is the **same payload** as the
problem alert, with the elapsed time in its `text`. There is no reminder-specific type, title or
colour to branch on: a consumer that already handles the confirmed-problem message handles
reminders without a change.

The `text` is plain text with Slack's `<url|label>` link syntax, so a non-Slack consumer should
expect that markup rather than HTML or Markdown.

The link points at the **subject timeline**
(`/ui/workspace/{workspace}/monitoring/subject/{subject}`). The subject id is an opaque id, not a
database number. A monitor that somehow has no subject yet keeps the older `/rule/{uid}/history`
link so an alert never links nowhere. Its host comes from
[`general.site_url`](/v1.8.0/operating/configuration/); when that is unset the URL reads
`SITE_URL_NOT_CONFIGURED/ui/…` and the alert is still sent.

## Sending a different shape

Attach a [transformation](/v1.8.0/alerting/transformations/) to the destination and it receives
that template rendered instead — a PagerDuty event, your own JSON, a line of text. The content
type follows the template: `application/json` when it reads as JSON, `text/plain` otherwise. A
destination with no transformation gets the body above.

## What this release does not do

**New in 1.8.0:** a workspace has as many destinations as it needs, each subject chooses its own
([Alert delivery](/v1.8.0/alerting/alert-delivery/)), payloads are templatable, and every attempt
is recorded for 30 days ([Delivery log](/v1.8.0/alerting/delivery-log/)).

Still out of scope: **no retries** (one attempt, recorded either way), **no custom headers**, and
**no other channels** — no email, no SMS, no PagerDuty integration beyond posting the shape its
events API accepts. Routing is per subject and per alert kind; there is no per-rule switch.
