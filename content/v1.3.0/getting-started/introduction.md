---
title: "Introduction"
weight: 10
lede: "What Uptimer is, and the five ideas you need to use it."
description: "What Uptimer is and its core concepts."
---

Uptimer is a **developer-first uptime and synthetic-monitoring tool**. You define
what "healthy" means for a service; Uptimer checks it on a schedule from one or more
locations and alerts you when the result changes. It runs as a single Go binary
(shipped as a < 100 MB container) and stores its data in SQLite or PostgreSQL.

Everything the dashboard does, it does through the [REST API](/v1.3.0/reference/rest-api/) —
so anything you can click, you can script.

## Self-hosted or hosted

The same engine powers both. Run it yourself from
[`ghcr.io/myuptime-info/uptimer`](/v1.3.0/getting-started/quick-start/), or use the hosted
service at [myuptime.info](https://myuptime.info). The API, the concepts and this
documentation apply to both.

## The five ideas

| Concept | What it is |
|---|---|
| [Rule](/v1.3.0/core-concepts/rules-and-checks/) | One thing you monitor: an HTTP(S) target, an interval, and an expected response. |
| [Expected response](/v1.3.0/core-concepts/assertions/) | What counts as "up": expected status code(s), optionally a body substring. |
| [Region](/v1.3.0/core-concepts/regions/) | A location a check runs from. |
| [Remote worker](/v1.3.0/core-concepts/remote-workers/) | Your own prober that adds a private region. |
| [Workspace](/v1.3.0/core-concepts/workspaces/) | The container that owns rules and members. |

> Once Uptimer is running, the fastest way to learn it is
> [Quick start](/v1.3.0/getting-started/quick-start/) → your first rule.
