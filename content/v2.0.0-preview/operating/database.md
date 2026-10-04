---
title: "Database and migrations"
weight: 20
lede: "SQLite or PostgreSQL, uptimer migrate, the PostgreSQL migration ledger, and how the 2.0 PostgreSQL path was soak-tested."
---

## Choose a backend

Set `UPTIMER__DB__DSN`:

| Backend | DSN | Use it for |
|---|---|---|
| SQLite (default) | `sqlite3:///data/uptimer.sqlite` | One box, a trial, a small installation. |
| PostgreSQL | `postgres://user:password@host:5432/uptimer?sslmode=require` | A long-lived installation that upgrades through schema changes, or services run apart. |

With PostgreSQL the data directory still holds the session key, the worker authority and the durable queue. Mount it as a volume either way.

## Run migrations

`uptimer migrate` brings the schema up to date and exits. It exits non-zero if it cannot.

A single box can let the server migrate on start: boot migration is on by default. A deployment that runs several processes runs `uptimer migrate` once per rollout, waits for it, then starts every serving process with:

```bash
UPTIMER__DB__BOOT_MIGRATE=false
```

Otherwise every database-backed process migrates as it starts, and a rollout of several races to change one schema.

Back up the database before you migrate it.

## How PostgreSQL migrates

On PostgreSQL the schema comes from ordered SQL steps built into the binary. The `server_schema_migrations` table records each applied version.

- An empty database gets the 2.0 baseline.
- Each step commits together with its ledger row, or not at all. After a failure the database stays at the previous version: fix the cause and run `uptimer migrate` again.
- Two `migrate` runs at once wait for each other. Nothing is applied twice.
- `migrate`, and boot migration when it is on, refuse a database migrated by a newer release. With boot migration off, nothing checks this on start: run the matching release's `uptimer migrate` before its services.
- A 2.0 database made before the ledger existed adopts the baseline only if its tables match it exactly. Any extra or different column, index, constraint, trigger or row security is refused, named, and nothing is recorded. Your own separate tables are fine.
- PostgreSQL never falls back to building tables from the code's models.

## How SQLite migrates

SQLite takes its schema from the code's models and keeps no ledger. It handles new installations and added tables or columns. It does not rename or drop columns or backfill data. A release that needs that on SQLite says so in its notes and gives its own path. Use PostgreSQL for an installation you will keep through schema changes.

## A 1.x database is refused

Uptimer 2.0 does not read or convert a 1.x database. `migrate`, `serve`, `dev` and `worker-cert` refuse to start against one, and change nothing in it. See [Coming from 1.8](/v2.0.0-preview/operating/upgrading-from-1.8/).

## PostgreSQL soak

The 2.0 PostgreSQL path was soak-tested before the preview, beyond the migration test suite: migrate a fresh database, serve, flip a watched target between healthy and failing, and restart the server, for 30 minutes. A run passes only when every confirmed problem and recovery is delivered and received, the ledger stays at the baseline and is re-adopted on live data, and the log has no error lines.

| Date | Run | Result |
|---|---|---|
| 2026-10-03 | managed worker, 30 minutes, 2 restarts, 11 flips | PASS: 308 observations, 7 incidents, 12 of 12 deliveries received, ledger kept, 0 error log lines |
| 2026-10-03 | managed worker and an external sender, 30 minutes, 2 restarts, 11 flips | PASS: 694 observations, 24 of 24 deliveries received, sender 385 accepted and 0 refused, ledger kept, 0 error log lines |
