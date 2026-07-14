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

1. In Slack, create an **Incoming Webhook** and copy its URL.
2. In Uptimer, open **Workspace → Settings → Webhook URL**, paste it, and save.

On the next status change, Uptimer POSTs a Slack-formatted message — green when a rule recovers,
red when it goes down — with a link back to the rule's history.

> Alerts fire on **state transitions**, not on every check: one message when a rule goes down,
> one when it recovers — not one per interval.

The webhook is configured in the dashboard (not the REST API), and there is **one URL per
workspace**. It covers **every rule** in that workspace — there is no per-rule switch: set the
URL and all rules alert. To send somewhere other than Slack, see
[Webhooks](/v1.3.0/alerting/webhooks/).
