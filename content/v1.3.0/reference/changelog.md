---
title: "Changelog"
weight: 40
lede: "What changed for users since 1.1."
description: "User-facing changes from 1.1 to 1.3.0."
---

Highlights since 1.1, grouped by theme. Full commit history is on the
[GitHub releases](https://github.com/myuptime-info/uptimer/releases) page.

## Packaging
- **The image moved to GitHub Container Registry.** Pull `ghcr.io/myuptime-info/uptimer`
  (`:latest` stable · `:X.Y.Z` pinned · `:edge` pre-release). The old Docker Hub image is retired.

## Deployment & database
- **New `uptimer migrate` command** plus `server.db.boot_migrate` — run schema migrations as a
  one-shot job and gate rollouts on a fully-migrated database.
- **PostgreSQL migrations are now versioned** (with data backfills) and upgrade-safe; SQLite
  stays auto-migrated for dev. See
  [Choosing a database](/v1.3.0/operating/configuration/#choosing-a-database).

## Running Uptimer
- **`server --services …` replaces the old `run` command** — select services with
  `--services api,ui,grpc,availabilities`.
- New `server.sqids_salt` setting (give it a unique value in production).

## Monitoring
- **Worker-regions management** in the dashboard (still being refined).
- New **`grpc_request_duration_seconds`** metric on [`/metrics`](/v1.3.0/reference/metrics/).

## Extensibility
- A **pluggable architecture** (job registry + route/gRPC extension seams) lets a build add
  services and routes without forking core.

## Fixes & UI
- Smaller CSS payload and a faster dashboard.
- Correct paging on the availability-history view.
- UTF-8 characters render correctly in notifications.
