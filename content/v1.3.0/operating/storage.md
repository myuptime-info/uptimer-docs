---
title: "Persistent storage"
weight: 20
lede: "Where Uptimer keeps data and config, and how to persist them."
description: "The data directory, config file, and database."
---

Uptimer keeps state under one **data directory** and reads settings from one **config file**.
Mount both from the host so they survive restarts.

## Inside the image

```text
/app/configs/default.yml   # default (dev) config
/app/uptimer               # the binary
/data/                     # data_dir — database, keys, identities (mount this)
```

## The data directory

`general.data_dir` (default `/data`, env `UPTIMER__GENERAL__DATA_DIR`) holds:

| File | What |
|---|---|
| `server.pem` / `server.uuid` | Server identity — signs API keys, validates workers. |
| `worker.pem` / `worker.uuid` | Worker identity. |
| `server_db.sqlite` | Control-plane database (SQLite only). |

```sh
docker run -p 2517:2517 -v uptimer-data:/data {{< image >}}
```

Lose `server.pem` and existing API keys and UI sessions stop validating; lose a worker's
identity and it must be re-registered. Back up the volume — or use PostgreSQL plus a secret
store for the keys.

## Custom config

Extract the default to edit it, then mount it back:

```sh
docker create --name tmp {{< image >}}
docker cp tmp:/app/configs/default.yml ./uptimer.yml
docker rm tmp
```

```sh
docker run -p 2517:2517 \
  -v "$PWD/uptimer.yml:/app/configs/config.yml" \
  {{< image >}} --cfg /app/configs/config.yml server
```

`--cfg` is optional (defaults to `configs/default.yml`). Every key also has a `UPTIMER__…`
environment override — see [Configuration](/v1.3.0/operating/configuration/).

Unlike `dev`, the `server` command needs a server identity on the `/data` volume first — if it
exits with a missing `server.uuid`, run [`server init`](#bootstrap-identities) once against the
same volume before starting it.

## Database

The DSN scheme picks the backend — `sqlite3://` or `postgres://`. Server and worker can even
share one database; their tables use distinct prefixes.

### SQLite — dev

Zero setup: a file under `/data`, created and migrated on boot.

```yaml
server: { db: { dsn: sqlite3:///data/server_db.sqlite } }
worker: { db: { dsn: sqlite3:///data/worker_db.sqlite } }
```

### PostgreSQL — production

Point the DSN at Postgres. Use **two databases** — `uptimer_server` (control plane) and
`uptimer_worker`:

```yaml
server: { db: { dsn: "postgres://uptimer:secret@db:5432/uptimer_server?sslmode=disable" } }
worker: { db: { dsn: "postgres://uptimer:secret@db:5432/uptimer_worker?sslmode=disable" } }
```

Create both databases before first start (a Postgres init script is the easy way).

### Migrations

- **SQLite** is auto-migrated on boot — convenient for dev, not guaranteed safe across upgrades.
- **PostgreSQL** uses **versioned migrations** (schema changes + data backfills). By default they
  run at boot (`server.db.boot_migrate: true`). For production, run them once with the dedicated
  [`uptimer migrate`](/v1.3.0/operating/production/) job and set `boot_migrate: false` on the app
  containers — the schema is then brought to head atomically, once, instead of by each booting
  replica.

Background: [Choosing a database](/v1.3.0/operating/configuration/#choosing-a-database).

## Bootstrap identities

`server init` / `worker init` generate the keys and UUIDs (add `--force` to regenerate — note
that regenerating the server key invalidates existing sessions):

```sh
docker run -v uptimer-data:/data {{< image >}} server init
```
