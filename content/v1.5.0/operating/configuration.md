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
| `server.sqids_salt` | `UPTIMER__SERVER__SQIDS_SALT` | *(change me)* | Salt for public IDs — **set a unique value in production, once**. Changing it later invalidates existing Monitoring URLs and API incident ids. |
| `server.auth.dev` | `UPTIMER__SERVER__AUTH__DEV` | `false` | Fake auth — any visitor is admin. Dev only. |
| `server.auth.oidc.*` | `UPTIMER__SERVER__AUTH__OIDC__*` | — | Real login via OIDC — see [Authentication](/v1.5.0/operating/authentication/). |
| `server.auth.oidc.end_session_endpoint` | `UPTIMER__SERVER__AUTH__OIDC__END_SESSION_ENDPOINT` | *(from discovery)* | Provider logout URL. Set it only when discovery advertises none — [details](/v1.5.0/operating/authentication/#logging-out-of-the-provider). |
| `server.auth.oidc.post_logout_redirect_param` | `UPTIMER__SERVER__AUTH__OIDC__POST_LOGOUT_REDIRECT_PARAM` | `post_logout_redirect_uri` | Query parameter carrying the return URL (`returnTo` on Auth0, `logout_uri` on Cognito). |
| `grpc.port` | `UPTIMER__GRPC__PORT` | — | Worker gRPC channel (reference deploys use `50051`). |
| `worker.grpc_server` | `UPTIMER__WORKER__GRPC_SERVER` | — | Where a worker dials the server. |
| `general.data_dir` | `UPTIMER__GENERAL__DATA_DIR` | `/data/` | Keys, IDs and SQLite live here — [persist it](/v1.5.0/operating/storage/). |
| `general.site_url` | `UPTIMER__GENERAL__SITE_URL` | — | Base URL used in alert links. Set it on every server process — unset, alerts still send but their link is not clickable. See [Slack alerts](/v1.5.0/alerting/slack-alerts/). |
| `general.logging.level` | `UPTIMER__GENERAL__LOGGING__LEVEL` | `DEV` | `DEV` or `PROD`. |
| `general.metrics_port` | `UPTIMER__GENERAL__METRICS_PORT` | — | Prometheus port when `--metrics` is set — see [Metrics](/v1.5.0/reference/metrics/). |

> **Removed in 1.4.0: `worker.db.dsn` / `UPTIMER__WORKER__DB__DSN`.** Workers hold their rules in
> memory and no longer have a database. The setting is still accepted and ignored, so upgrading
> needs no configuration change — see [Storage](/v1.5.0/operating/storage/#database).

## Choosing a database

The DSN scheme selects the backend:

| DSN | Backend | Use for |
|---|---|---|
| `sqlite3://…` | SQLite | Local dev and throwaway instances (schema via GORM auto-migrate). |
| `postgres://…` | PostgreSQL | **Anything you keep** (versioned migrations + data backfills; upgrade-safe). |

SQLite is zero-setup and perfect for trying Uptimer, but its schema is auto-migrated and not
guaranteed safe across upgrades. **For production, use PostgreSQL** — its migrations are
versioned and applied by the [`migrate`](/v1.5.0/operating/production/) command, so an upgrade
is brought to head atomically instead of half-applying under a booting replica. Switching
backend is a fresh database, not a data migration.
