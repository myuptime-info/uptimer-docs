---
title: "Uptimer v1.3.0"
lede: "Self-hosted uptime & synthetic monitoring in a single Go binary — HTTP/TCP/DNS checks from multiple regions, Slack & webhook alerts, and a REST API the dashboard itself is built on."
description: "Uptimer v1.3.0 documentation — self-hosted uptime monitoring."
---

Uptimer watches your services from one or many regions, tells you when they break,
and exposes everything through a REST API. It runs as a single container (< 100 MB),
self-hosted or on [myuptime.info](https://myuptime.info) — the API is identical either way.

> **New in 1.3.0** — the image now ships from **GitHub Container Registry**
> (`ghcr.io/myuptime-info/uptimer`), a dedicated `migrate` command for production
> deploys, and a pluggable job/route architecture. See the [changelog](/v1.3.0/reference/changelog/).

## Start here
