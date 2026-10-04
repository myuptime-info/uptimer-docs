---
title: "Coming from 1.8"
weight: 60
lede: "2.0 is a fresh installation. What to recreate, what does not transfer, how settings map, and how to retire 1.8."
---

2.0 is a fresh installation with a new database and new configuration. Nothing is imported or
converted from 1.8. You recreate what you need in 2.0, run both side by side,
and retire 1.8 when you are ready. 2.0 never opens the 1.8 database for
writing: pointed at it by mistake, it refuses to start and changes nothing.

## What moves and what does not

| 1.8 data | In 2.0 |
|---|---|
| Users and OIDC identities | **Recreate.** Each person signs in to 2.0 once; the account and a personal Workspace are made then. 1.8 OIDC links are not read. |
| Server admins | **Recreate** with `UPTIMER__AUTH__OIDC__ADMIN_SUBJECTS`. |
| Workspaces and memberships | **Recreate.** Every account gets one personal Workspace on its first sign-in; 2.0 has no screen for creating more. Rename the one that will be shared (Settings → Workspace name) and add members by their 2.0 user id once they have signed in (Settings → Members). |
| Website checks (Subjects) | **Recreate** as Resources from the Website template: URL, method, healthy status codes, expected text, interval, Locations. |
| Rules (location quorum, waits) | **Recreate** on the Resource: "Call it down when" (any / more than half / every location), "Confirm after", "Recover after". Custom subject, signal and rule authoring is retired. |
| Regions | **Recreate** as Locations (Server → Locations). |
| Workers | **Replace.** Register each worker in 2.0 and issue it a client certificate with `uptimer worker-cert`. 1.8 worker daemons do not speak the 2.0 protocol. |
| Destinations and transformations | **Recreate** (Settings → Destinations, Transformations), then choose the default. |
| API keys | **Reissue** (API keys). 1.8 tokens are not valid. The 1.x API paths answer `410`; scripts move to the 2.0 API and SDK. |
| External senders | **Reissue** an Observation address (Settings → Observation endpoints) and update each sender. |
| Maintenance windows, reminders | **Set again** on each Resource's settings. |
| Incidents, timeline, observations, availabilities | **Not transferred.** 2.0 history starts empty. |
| Delivery history | **Not transferred.** |

A 2.0 workspace configuration can be exported and imported between 2.0
installations (Settings → Configuration). It does not read 1.8.

## Settings

Use a new data directory or volume. These are the settings that changed name
or meaning; everything else is in [Running Uptimer](/v2.0.0-preview/operating/running/).

| 1.8 (or the 2.0 preview `UPTIMER__V2__*`) | 2.0 |
|---|---|
| `UPTIMER__SERVER__DB__DSN` (`UPTIMER__V2__DB__DSN`) | `UPTIMER__DB__DSN` — **a new database**. Default `sqlite3://<data>/uptimer.sqlite`. |
| `UPTIMER__SERVER__DB__BOOT_MIGRATE` | `UPTIMER__DB__BOOT_MIGRATE` |
| `UPTIMER__GENERAL__DATA_DIR` | `UPTIMER__DATA_DIR` — a new directory. The image sets `/data`. |
| `UPTIMER__SERVER__KEY_FILE` (`UPTIMER__V2__KEY_FILE`) | `UPTIMER__KEY_FILE`, default `<data>/session.pem`, made on first start. |
| `UPTIMER__SERVER__UUID_FILE` | Gone. |
| `UPTIMER__SERVER__SQIDS_SALT` (`UPTIMER__V2__SQIDS__SALT`) | `UPTIMER__SQIDS__SALT`. Set a new value; 1.8 links do not carry over. |
| `UPTIMER__SERVER__UI__PORT` (1.8 image: 2517) (`UPTIMER__V2__UI__PORT`) | `UPTIMER__UI__PORT`, default 8080. |
| `UPTIMER__SERVER__API__PORT` | Unchanged name, default 2518; used only when the API runs as its own process. |
| `UPTIMER__GRPC__PORT` | Unchanged: 50051. The protocol is new (mutual TLS). |
| `UPTIMER__GENERAL__METRICS_PORT` | `UPTIMER__OPS__PORT`, default 9090, required: `/metrics`, `/livez`, `/readyz`. |
| `UPTIMER__SERVER__AUTH__DEV` (`UPTIMER__V2__AUTH__DEV`) | `UPTIMER__AUTH__DEV`. Off by default; never in production. |
| `UPTIMER__SERVER__AUTH__OIDC__*` | `UPTIMER__AUTH__OIDC__*`, plus `UPTIMER__AUTH__OIDC__ADMIN_SUBJECTS`. The callback is now `<site>/ui/auth/oidc/callback` (1.8: `/ui/auth/oauth/callback`); register it with your provider. |
| `UPTIMER__V2__SERVICES` | `UPTIMER__SERVICES`, or `serve --services`. |
| `UPTIMER__GENERAL__SITE_URL`, `UPTIMER__SENTRY__DSN`, `UPTIMER__SENTRY__ENV` | Unchanged. |
| `UPTIMER__GENERAL__LOGGING__LEVEL` / `__SQL` | Unchanged names; 2.0 values are `debug`/`info`/`warn`/`error` and `silent`/`error`/`warn`/`info`. `DEV` and `PROD` are refused. |
| `UPTIMER__WORKER__GRPC_SERVER` | Unchanged. |
| `UPTIMER__WORKER__KEY_FILE`, `__UUID_FILE`, `__GRPC_USE_TLS` | Replaced by `UPTIMER__WORKER__CERT_FILE`, `__KEY_FILE`, `__CA_FILE` (always TLS). |
| `--cfg` YAML file, `server init`, `worker init` | Gone. Environment and flags only; `worker-cert` issues worker identities. |

## Procedure

Keep 1.8 running throughout. Steps 1–9 do not touch it.

1. **Back up 1.8.** Copy its database and data directory. 2.0 does not
   change them, but the backup is what lets you go back after step 10.
2. **Prepare new storage** for 2.0: a new volume or directory for
   `UPTIMER__DATA_DIR`, and either the default SQLite file inside it or a
   **new** PostgreSQL database. Never reuse the 1.8 database or data
   directory.
3. **Configure 2.0** with the settings above, for example:

   ```yaml
   image: {{< image >}}   # preview build
   environment:
     UPTIMER__DATA_DIR: /data
     UPTIMER__DB__DSN: postgres://uptimer:…@db:5432/uptimer2   # or omit for SQLite in /data
     UPTIMER__SQIDS__SALT: &lt;a new random value>
     UPTIMER__GENERAL__SITE_URL: https://uptimer2.example.com
     UPTIMER__AUTH__OIDC__ISSUER_URL: https://id.example.com/
     UPTIMER__AUTH__OIDC__CLIENT_ID: uptimer
     UPTIMER__AUTH__OIDC__CLIENT_SECRET: &lt;secret>
     UPTIMER__AUTH__OIDC__ADMIN_SUBJECTS: &lt;your subject>
   volumes:
     - uptimer2-data:/data
   ```

4. **Create the schema:** `uptimer migrate`. It exits non-zero if it cannot.
5. **Start 2.0:** `uptimer serve` (or the bare image). Wait until
   `/readyz` on the operations port answers `200`.
6. **Sign in** through your provider. Ask each person to sign in once, then
   add them to the shared Workspace (Settings → Members).
7. **Recreate Locations and workers.** Add each Location (Server → Locations).
   Register each worker (Server → Workers) under a new UUID, then on the
   control plane run
   `uptimer worker-cert --uid <uuid> --out <dir>` and copy `worker.pem`,
   `worker-key.pem` and `worker-ca.pem` to the worker host. Start
   `uptimer worker` there with `UPTIMER__WORKER__GRPC_SERVER` set to the 2.0
   worker API. Leave the 1.8 workers running for 1.8.
8. **Recreate destinations, transformations and Resources**, then
   **reissue** API keys and Observation addresses and point scripts and
   senders at 2.0.
9. **Check 2.0:** each Resource shows observations from its Locations, and a
   test message from each destination arrives (Settings → Destinations →
   More → Send test).
10. **Retire 1.8** when 2.0 is checking everything you need and alerting where
    you want. While both run, both alert; turn 1.8's destinations off or stop
    1.8 when 2.0 is verified. Then stop the 1.8 workers and server, and keep
    the backup from step 1 for as long as you may want the old history.

## Going back

Before step 10, going back is stopping 2.0 and carrying on with 1.8: its
database and configuration were never changed. After you retire 1.8 and
remove its data, going back means restoring the step 1 backup into a 1.8
installation. Nothing created in 2.0 moves back to 1.8.

## If 2.0 is pointed at the 1.8 database

`uptimer migrate`, `serve`, `dev` and `worker-cert` refuse to start:

```text
UPTIMER__DB__DSN points at an Uptimer 1.x database. Uptimer 2.0 does not use
or change it: give 2.0 a new database (see docs/operations/upgrading-from-1.8.md)
```

The check reads only. A SQLite file is opened read-only first, so its
journal mode and contents stay as they were; on PostgreSQL the check asks
the catalogue.
