---
title: "Slack alerts"
weight: 10
lede: "Post a message to Slack when a rule changes state."
description: "Send alerts to Slack via the workspace webhook."
---

Uptimer sends alerts through **one webhook per workspace**. Point it at a Slack
[incoming webhook](https://api.slack.com/messaging/webhooks) and you get a message in your
channel whenever a rule flips **up → down** (or recovers).

## Set it up

1. Set [`general.site_url`](/v1.4.0/operating/configuration/) to your instance's public base URL,
   for example `UPTIMER__GENERAL__SITE_URL: "https://uptimer.example.com"`.
2. In Slack, create an **Incoming Webhook** and copy its URL.
3. In Uptimer, open **Workspace → Settings → Webhook URL**, paste it, and save.

On the next status change, Uptimer POSTs a Slack-formatted message with a link back to the rule's
history.

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
  [locations](/v1.4.0/core-concepts/locations/) at all. A monitor with a single location omits
  the line: there is nothing to compare against.
- **The error is the sender's own**, quoted and truncated, never reworded. `i/o timeout` versus
  `connection refused` versus a TLS error is the first thing worth acting on.
- **"Down for 2m before we alerted"** is the confirmation hold, not slowness — Uptimer waits to
  be sure before it pages anyone.

A **no data** alert says `No reports from 2 of 3 locations` and, plainly, that Uptimer cannot
tell whether the site is up — which is not the same claim as "your site is down". A **recovery**
says how long the outage lasted and when it ended.

> Alerts fire on **state transitions**, not on every check: one message when a rule goes down,
> one when it recovers — not one per interval.

The webhook is configured in the dashboard (not the REST API), and there is **one URL per
workspace**. It covers **every rule** in that workspace — there is no per-rule switch: set the
URL and all rules alert. To send somewhere other than Slack, see
[Webhooks](/v1.4.0/alerting/webhooks/).

## When an alert actually fires

An alert is sent on a status **transition**, so Uptimer must already have a status to change
*from*. That has a few consequences worth knowing when you're testing:

- A brand-new rule's **first** check only records its starting status — no alert is sent for it.
- So a rule that is **down from the moment you create it never alerts** — it has no healthy
  baseline to fall from. Point a new rule at a **healthy** URL first, let it go **Up**, and it
  will then alert on the next real outage.
- Give it at least **two check intervals** (≥ 2 minutes at the default one-minute cadence) to
  produce the first transition.
- A monitor stuck at **No Data** (no [location](/v1.4.0/core-concepts/locations/) assigned) never alerts
  — it isn't being checked at all.

The webhook is called **from the Uptimer server** (or its container), so the URL must be
reachable from there — a `localhost` receiver on your laptop is **not** reachable from inside the
container. If nothing arrives, check the server logs for the outgoing webhook POST.

> **Delivery is best-effort.** Uptimer sends the webhook once, in the background — there is no
> delivery-status indicator, retry, or "send test" button yet, and a failed POST is recorded only
> in the **server logs**, not the dashboard. If alerts don't arrive and the URL is reachable, the
> logs are the place to look.
