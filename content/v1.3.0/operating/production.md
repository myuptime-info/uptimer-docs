---
title: "Production deployment"
weight: 40
lede: "Run Uptimer as separate services against PostgreSQL, with migrations gated by a job."
description: "Production topology: split services, Postgres, migrate job."
---

A production install differs from the all-in-one `dev` image in four ways: **PostgreSQL**, **real
auth**, **one process per service**, and **migrations run by a dedicated job**. The reference
[`deploy/docker-compose`](https://github.com/myuptime-info/uptimer/tree/main/deploy/docker-compose)
shows the full topology; the essentials are below.

## Split the services

Run the server by role, plus any workers:

| Command | Role |
|---|---|
| `server --services api,ui` | Dashboard + REST API (port `2517`). |
| `server --services grpc` | Worker gRPC channel (port `50051`). |
| `server --services availabilities` | Runs the scheduled checks. |
| `worker` | Optional extra probers. |

`api,ui`, `grpc` and `availabilities` are all "the server" — they share **one identity**
(`server.pem`/`server.uuid`) via a shared volume.

## Database & migrations

Use PostgreSQL with two databases — `uptimer_server` (control plane) and `uptimer_worker`. Run
schema migrations from a **one-shot job** before the app starts, and tell the app processes not
to migrate on boot:

```sh
uptimer migrate                      # brings the schema to head, then exits
# app processes then run with:
UPTIMER__SERVER__DB__BOOT_MIGRATE=false
```

This is what makes upgrades safe: the schema is brought to head once, atomically, rather than by
each booting replica.

## Bootstrap

```sh
uptimer server init   # once — server identity
uptimer worker init   # once per worker
```

Register each worker (UUID + public key) in the dashboard, then start it pointed at the gRPC
address — see [Remote workers](/v1.3.0/core-concepts/remote-workers/).

## Image

Pin the version explicitly:

```sh
docker pull {{< image >}}
```
