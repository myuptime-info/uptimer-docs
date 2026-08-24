---
title: "Slack alerts"
weight: 10
lede: "Post a message to Slack when a monitor changes state."
description: "Send alerts to Slack via the workspace webhook."
---

Uptimer sends alerts through **one webhook per workspace**. Point it at a Slack
[incoming webhook](https://api.slack.com/messaging/webhooks) and you get a message when a monitor
has a **confirmed problem**, when it has **confirmed no data**, and when it **recovers**.

## Set it up

1. Set [`general.site_url`](/v1.5.0/operating/configuration/) to your instance's public base URL,
   for example `UPTIMER__GENERAL__SITE_URL: "https://uptimer.example.com"`.
2. In Slack, create an **Incoming Webhook** and copy its URL.
3. In Uptimer, open **Workspace → Settings → Webhook URL**, paste it, and save.

On the next status change, Uptimer POSTs a Slack-formatted message with a link back to the
**subject timeline** — the page that carries the check, its signal, its rule and its history, so
the alert answers "what happened" without a second click. (Before 1.5.0 the link went to a single
rule's history page, which no longer exists.)

> **No webhook, no notifications.** Monitoring shows a warning while the workspace has none:
> incidents are still detected and recorded on the timeline, but nobody is told until you add a
> webhook URL here.

> **Set `site_url` on every server process, not just the web one.** Alerts are sent by
> `server --services availabilities`, and that is the process that builds the link — putting the
> setting on the UI container alone leaves the alerting one without it. Without `site_url` the
> alert is still sent; its link just reads `SITE_URL_NOT_CONFIGURED/ui/…` instead of a working
> address, and the server logs a warning at startup.

## What an alert says

There are three, and the colour tells them apart at a glance: red for a confirmed problem, amber
for no data, green for a recovery.

```text
Checkout API is down
Failing from 2 of 3 locations — de, fr
`Get "https://checkout.example/health": dial tcp 104.20.23.154:9: i/o timeout`
Down for 2m before we alerted.
View timeline
```

- **The location count is the useful part.** "2 of 3" separates a real outage from one bad
  vantage point — the reason a monitor is checked from several
  [locations](/v1.5.0/core-concepts/locations/) at all. A monitor with a single location omits
  the line: there is nothing to compare against.
- **The error is the sender's own**, quoted and truncated, never reworded. `i/o timeout` versus
  `connection refused` versus a TLS error is the first thing worth acting on.
- **"Down for 2m before we alerted"** is the confirmation hold, not slowness — Uptimer waits to
  be sure before it pages anyone.

A **no data** alert says `No reports from 2 of 3 locations` and, plainly, that Uptimer cannot
tell whether the site is up — which is not the same claim as "your site is down". A **recovery**
says how long the outage lasted and when it ended.

> Alerts fire on **state transitions**, not on every check: one message when a monitor goes down,
> one when it recovers — not one per interval.

The webhook is configured in the dashboard (not the REST API), and there is **one URL per
workspace**. It covers **everything** in that workspace — there is no per-monitor or per-rule
switch: set the URL and all of them alert. To send somewhere other than Slack, see
[Webhooks](/v1.5.0/alerting/webhooks/).

## When an alert actually fires

An alert is sent when a problem is **confirmed** — that is, when it has held for 2 minutes. There
is no need for a healthy period first, which is what makes it worth testing:

- **A monitor that is failing from the moment you create it does alert.** It opens an incident on
  its first bad check and alerts about 2 minutes later. No prior Up state is required.
- During those 2 minutes the list shows **Pending**. That is the confirmation hold, not a delay in
  delivery.
- **No Data confirms and alerts too.** A monitor with no
  [location](/v1.5.0/core-concepts/locations/) assigned cannot be decided, so it settles on No
  Data and sends the "no data" alert — it does not stay quiet.
- **Recovery alerts only follow an alert.** If a problem clears inside the 2-minute hold, nothing
  was announced, so no recovery is announced either.
- Alerts are one per incident, not one per check: one when it is confirmed, one when it closes.

The webhook is called **from the Uptimer server** (or its container), so the URL must be
reachable from there — a `localhost` receiver on your laptop is **not** reachable from inside the
container. If nothing arrives, check the server logs for the outgoing webhook POST.

> **Delivery is best-effort.** Uptimer sends the webhook once, in the background — there is no
> delivery-status indicator, retry, or "send test" button yet, and a failed POST is recorded only
> in the **server logs**, not the dashboard. If alerts don't arrive and the URL is reachable, the
> logs are the place to look.
