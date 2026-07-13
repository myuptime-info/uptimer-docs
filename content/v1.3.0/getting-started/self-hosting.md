---
title: "Self-hosting"
weight: 20
lede: "Grow the dev container into a production deployment — one step at a time."
description: "From the one-command dev image to a production Uptimer deployment."
---

Uptimer scales from one command to a split, migrated, Postgres-backed cluster. Add only the
steps you need — each one is independent, and each hardens the one before.

## 1 · Dev — one command

```sh
docker run -p 2517:2517 {{< image >}}
```

Everything in one process, fake auth, in-memory data. Great for a trial; wrong for anything you
keep. The rest of this page hardens it.

## 2 · Keep your data

Dev data vanishes on restart. Mount a volume for the database, keys and IDs:

```sh
docker run -p 2517:2517 -v uptimer-data:/data {{< image >}}
```

More: [Persistent storage](/v1.3.0/operating/storage/).

## 3 · Real auth + a real database

Turn off dev auth (OIDC gives real logins) and point at PostgreSQL (upgrade-safe, versioned
migrations — SQLite is dev-only):

```yaml
server:
  auth:
    dev: false
    oidc: { issuer_url: "https://id.example.com/…", client_id: "uptimer", client_secret: "…" }
  db:
    dsn: "postgres://user:pass@db:5432/uptimer_server"
```

More: [Authentication](/v1.3.0/operating/authentication/) ·
[Choosing a database](/v1.3.0/operating/configuration/#choosing-a-database).

## 4 · Production topology

Split the server into per-service containers, run migrations as a one-shot job, and add workers
for extra regions. Full walk-through: [Production deployment](/v1.3.0/operating/production/).

> Stop at whichever step fits — a single persistent container with OIDC is a perfectly good
> small deployment.
