---
title: "Configuration"
weight: 10
lede: "One YAML file, every key overridable by an environment variable."
description: "Config file, env overrides, and choosing a database."
---

Uptimer reads a YAML config (`--cfg`, default `configs/default.yml`). **Every key can be
overridden by an environment variable** using the `UPTIMER__` prefix with `__` between levels.
Env wins over YAML; built-in defaults fill the rest.

```sh
# equivalent
echo 'server: { ui: { port: 8080 } }' > my.yml && uptimer --cfg my.yml server
UPTIMER__SERVER__UI__PORT=8080 uptimer server
```

## Common keys

| Key | Env | Default | Purpose |
|---|---|---|---|
| `server.ui.port` | `UPTIMER__SERVER__UI__PORT` | `2517` | Web UI **and** REST API (served under `/api`). |
| `server.db.dsn` | `UPTIMER__SERVER__DB__DSN` | `sqlite3:///data/server_db.sqlite` | Control-plane database (see below). |
| `server.db.boot_migrate` | `UPTIMER__SERVER__DB__BOOT_MIGRATE` | `true` | Migrate at boot; set `false` when a dedicated `migrate` job runs migrations. |
| `server.sqids_salt` | `UPTIMER__SERVER__SQIDS_SALT` | *(change me)* | Salt for public IDs — **set a unique value in production**. |
| `server.auth.dev` | `UPTIMER__SERVER__AUTH__DEV` | `false` | Fake auth — any visitor is admin. Dev only. |
| `server.auth.oidc.*` | `UPTIMER__SERVER__AUTH__OIDC__*` | — | Real login via OIDC — see [Authentication](/v1.3.0/operating/authentication/). |
| `grpc.port` | `UPTIMER__GRPC__PORT` | — | Worker gRPC channel (reference deploys use `50051`). |
| `worker.grpc_server` | `UPTIMER__WORKER__GRPC_SERVER` | — | Where a worker dials the server. |
| `general.data_dir` | `UPTIMER__GENERAL__DATA_DIR` | `/data/` | Keys, IDs and SQLite live here — [persist it](/v1.3.0/operating/storage/). |
| `general.site_url` | `UPTIMER__GENERAL__SITE_URL` | — | Base URL used in alert links. |
| `general.logging.level` | `UPTIMER__GENERAL__LOGGING__LEVEL` | `DEV` | `DEV` or `PROD`. |
| `general.metrics_port` | `UPTIMER__GENERAL__METRICS_PORT` | — | Prometheus port when `--metrics` is set — see [Metrics](/v1.3.0/reference/metrics/). |

## Choosing a database

The DSN scheme selects the backend:

| DSN | Backend | Use for |
|---|---|---|
| `sqlite3://…` | SQLite | Local dev and throwaway instances (schema via GORM auto-migrate). |
| `postgres://…` | PostgreSQL | **Anything you keep** (versioned migrations + data backfills; upgrade-safe). |

SQLite is zero-setup and perfect for trying Uptimer, but its schema is auto-migrated and not
guaranteed safe across upgrades. **For production, use PostgreSQL** — its migrations are
versioned and applied by the [`migrate`](/v1.3.0/operating/production/) command, so an upgrade
is brought to head atomically instead of half-applying under a booting replica. Switching
backend is a fresh database, not a data migration.
