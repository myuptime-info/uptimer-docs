---
title: "Production deployment"
weight: 40
lede: "Run Uptimer as separate services against PostgreSQL, with migrations gated by a job."
description: "Production topology with a docker-compose reference."
---

Production differs from the dev image in four ways: **PostgreSQL**, **real auth**, **one process
per service**, and **migrations run by a dedicated job**.

## Services

| Command | Role |
|---|---|
| `server --services api,ui` | Dashboard + REST API (2517). |
| `server --services grpc` | Worker gRPC channel (50051). |
| `server --services availabilities` | Runs the scheduled checks. |
| `worker` | Probers — add as many as you need. |

`api,ui`, `grpc` and `availabilities` are one logical server: they share a single identity
(`server.pem`/`server.uuid`) via a shared volume.

## Database & migrations

Use PostgreSQL with two databases — `uptimer_server` (control plane) and `uptimer_worker`. Bring
the schema to head with a one-shot job before the app starts, and stop replicas migrating on
boot:

```sh
uptimer migrate                          # run once per deploy — gates the rollout
UPTIMER__SERVER__DB__BOOT_MIGRATE=false  # set on the app containers
```

Why: the schema is applied once, atomically, instead of racing across booting replicas.

## docker-compose

A minimal stack ([full reference](https://github.com/myuptime-info/uptimer/tree/main/deploy/docker-compose)):

```yaml
x-server-env: &server-env
  UPTIMER__SERVER__DB__DSN: "postgres://uptimer:secret@db:5432/uptimer_server?sslmode=disable"
  UPTIMER__SERVER__DB__BOOT_MIGRATE: "false"
  UPTIMER__SERVER__AUTH__DEV: "false"
  UPTIMER__SERVER__SQIDS_SALT: "change-me"
  UPTIMER__GRPC__PORT: "50051"
  UPTIMER__GENERAL__LOGGING__LEVEL: "PROD"

services:
  db:
    image: postgres:17
    environment: { POSTGRES_USER: uptimer, POSTGRES_PASSWORD: secret, POSTGRES_DB: uptimer_server }
    volumes: ["pg:/var/lib/postgresql/data"]
  migrator:
    image: {{< image >}}
    command: ["migrate"]
    environment: *server-env
    depends_on: [db]
    restart: "no"
  web:
    image: {{< image >}}
    command: ["server", "--services", "api,ui"]
    environment:
      <<: *server-env
      UPTIMER__SERVER__UI__PORT: "2517"
      UPTIMER__GENERAL__SITE_URL: "https://uptimer.example.com"
    ports: ["127.0.0.1:2517:2517"]      # publish on loopback; put TLS + real auth in front
    volumes: ["server:/data"]
    depends_on: [migrator]
  grpc:
    image: {{< image >}}
    command: ["server", "--services", "grpc"]
    environment: *server-env
    volumes: ["server:/data"]
    depends_on: [migrator]
  availabilities:
    image: {{< image >}}
    command: ["server", "--services", "availabilities"]
    environment: *server-env
    volumes: ["server:/data"]
    depends_on: [migrator]
  worker:
    image: {{< image >}}
    command: ["worker"]
    environment:
      UPTIMER__WORKER__DB__DSN: "postgres://uptimer:secret@db:5432/uptimer_worker?sslmode=disable"
      UPTIMER__WORKER__GRPC_SERVER: "grpc:50051"
    volumes: ["worker:/data"]
    depends_on: [grpc]

volumes: { pg: {}, server: {}, worker: {} }
```

The `uptimer_worker` database must exist too — create it next to `uptimer_server` (a Postgres
init script is the easy way). `web` publishes only on loopback; terminate TLS and add real auth
at your reverse proxy.

## Bootstrap

```sh
docker compose run --rm web server init      # once — server identity
docker compose run --rm worker worker init   # once per worker
```

Then register each worker (UUID + public key) in the dashboard — see
[Remote workers](/v1.3.0/core-concepts/remote-workers/).

## Image

Pin the version explicitly:

```sh
docker pull {{< image >}}
```
