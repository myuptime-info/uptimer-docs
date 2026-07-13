---
title: "Self-hosting"
weight: 20
lede: "Grow the dev container into a production deployment — one step at a time, each a runnable compose."
description: "The dev → production journey, with a reproducible docker-compose at each step."
---

Uptimer scales from one command to a split, migrated, Postgres-backed cluster. Each step below is
a **complete, runnable `docker-compose.yml`** plus the reason for it — add only the steps you
need; each hardens the one before.

## 1 · Dev — one command

```sh
docker run -p 2517:2517 {{< image >}}
```

The default `dev` command runs every service in one process, with fake auth (any visitor is an
admin) and an in-memory database. Nothing survives a restart — fine for a look. Everything below
makes it real.

## 2 · Persist data

Data (the SQLite database and the server/worker identity keys) must outlive the container. Mount
a volume at `/data`:

```yaml
# docker-compose.yml
services:
  uptimer:
    image: {{< image >}}
    ports: ["2517:2517"]
    volumes: ["uptimer-data:/data"]
volumes:
  uptimer-data:
```

`docker compose up`. See [Persistent storage](/v1.3.0/operating/storage/) for what lives in
`/data` and how to mount a custom config.

## 3 · A real database

SQLite is dev-only — its schema is auto-migrated and not guaranteed safe across upgrades. Add
PostgreSQL for versioned, upgrade-safe migrations:

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_USER: uptimer
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: uptimer_server
    volumes: ["pg:/var/lib/postgresql/data"]
  uptimer:
    image: {{< image >}}
    ports: ["2517:2517"]
    environment:
      UPTIMER__SERVER__DB__DSN: "postgres://uptimer:secret@db:5432/uptimer_server?sslmode=disable"
    depends_on: [db]
volumes:
  pg:
```

Still one process and still dev auth — but your data is now on a real database.
Background: [Choosing a database](/v1.3.0/operating/configuration/#choosing-a-database).

## 4 · Real authentication

Dev auth logs everyone in as an admin. Turn it off and add OIDC to the `uptimer` service from
step 3:

```yaml
    environment:
      UPTIMER__SERVER__DB__DSN: "postgres://uptimer:secret@db:5432/uptimer_server?sslmode=disable"
      UPTIMER__SERVER__AUTH__DEV: "false"
      UPTIMER__SERVER__AUTH__OIDC__ISSUER_URL: "https://id.example.com/realms/main"
      UPTIMER__SERVER__AUTH__OIDC__CLIENT_ID: "uptimer"
      UPTIMER__SERVER__AUTH__OIDC__CLIENT_SECRET: "…"
      UPTIMER__SERVER__AUTH__OIDC__REDIRECT_URL: "https://uptimer.example.com/ui/auth/oauth/callback"
```

A complete, runnable Keycloak + Uptimer stack is in
[Authentication → Keycloak](/v1.3.0/operating/authentication/#example-keycloak).

## 5 · Split into services

In production the server runs as separate processes — `api,ui`, `grpc`, `availabilities`, plus
`worker`s — so each scales and restarts independently, and a one-shot `migrate` job owns schema
changes. The full topology, as one `docker-compose.yml`, is on the
[Production deployment](/v1.3.0/operating/production/) page.

> Stop at whichever step fits — a single persistent container with PostgreSQL and OIDC is a
> perfectly good small deployment.
