---
title: "Self-hosting"
weight: 20
lede: "Grow the dev container into a production deployment — one step at a time, with the settings and the why."
description: "The dev → production journey: persistence, database, auth, split services."
---

Uptimer scales from one command to a split, migrated, Postgres-backed cluster. Add only the
steps you need — each is independent and hardens the one before.

## 1 · Dev — one command

```sh
docker run -p 2517:2517 {{< image >}}
```

The default `dev` command runs every service in one process, with fake auth (any visitor is an
admin) and an in-memory database. Nothing survives a restart. Fine for a look; the steps below
make it real.

## 2 · Persist data

Mount a volume at `/data` — it holds the database (when using SQLite) and the server/worker
identity keys, so they survive restarts:

```sh
docker run -p 2517:2517 -v uptimer-data:/data {{< image >}}
```

To change settings, mount a YAML config over the default:

```sh
docker run -p 2517:2517 -v uptimer-data:/data \
  -v "$PWD/uptimer.yml:/app/configs/config.yml" \
  {{< image >}} --cfg /app/configs/config.yml dev
```

More: [Persistent storage](/v1.3.0/operating/storage/).

## 3 · A real database

SQLite is dev-only — its schema is auto-migrated and not guaranteed safe across upgrades. For
anything you keep, use PostgreSQL (versioned, upgrade-safe migrations):

```yaml
server:
  db:
    dsn: postgres://uptimer:secret@db:5432/uptimer_server
```

Or set `UPTIMER__SERVER__DB__DSN`. Background: [Choosing a database](/v1.3.0/operating/configuration/#choosing-a-database).

## 4 · Real authentication

Dev auth logs everyone in as an admin. Turn it off and wire OIDC (Keycloak, Auth0, Google, …):

```yaml
server:
  auth:
    dev: false
    oidc:
      issuer_url:    https://id.example.com/realms/main
      client_id:     uptimer
      client_secret: "…"
      redirect_url:  https://uptimer.example.com/ui/auth/oauth/callback
```

More: [Authentication](/v1.3.0/operating/authentication/).

## 5 · Split into services

In production the server runs as separate processes — `api,ui`, `grpc`, `availabilities`, plus
`worker`s — so you can scale and restart each independently, and a one-shot `migrate` job owns
schema changes. The full topology with a ready-to-adapt `docker-compose.yml` is on the
[Production deployment](/v1.3.0/operating/production/) page.

> Stop at whichever step fits — a single persistent container with PostgreSQL and OIDC is a
> perfectly good small deployment.
