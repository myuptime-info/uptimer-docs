---
title: "Changelog"
weight: 40
lede: "What changed for users in 1.4.0, and since 1.1."
description: "User-facing changes from 1.1 to 1.4.0."
---

## 1.4.0

### Incident-based monitoring
- **A monitor's status is now decided across all of its locations**, not by the newest check to
  arrive. The form gains **Locations Required to Fail** — *Majority of locations* (default) or
  *At least one location*. A location that never reports counts as unknown and stays inside the
  decision, so a half-silent monitor reads **No Data** instead of trusting whichever location
  answered. See [Monitors & incidents](/v1.4.0/core-concepts/monitors-and-incidents/#how-many-locations-must-fail).
- **A problem must last 2 minutes before it is confirmed and alerted**, and a recovery must last
  2 minutes before the incident closes. Short blips no longer page you, though they do show up in
  the history.
- **History is now a timeline of incidents** — pending, problem, no data, recovering, closed —
  with the failing and silent locations on each event and the error they reported, replacing the
  old list of individual check results.
- Existing Slack alerts keep working unchanged.

### Checks identify themselves
- HTTP(S) checks now send `Uptimer/1.4.0 (+https://uptimer.myuptime.info)` instead of
  `Go-http-client/1.1`, so you can recognise and filter monitoring traffic in logs and analytics.
  The value carries no workspace, worker or location, and is not configurable.

### Logging out ends the provider session
- Signing out now also ends the session at your OIDC provider, so the next login no longer signs
  the same person straight back in. Providers that advertise `end_session_endpoint` need no
  configuration; for the rest, set `server.auth.oidc.end_session_endpoint` and, if it renames the
  return-URL parameter, `server.auth.oidc.post_logout_redirect_param`. See
  [Authentication](/v1.4.0/operating/authentication/#logging-out-of-the-provider).

### Workers no longer need a database
- A worker keeps its rules in memory and receives them over gRPC. `worker.db.dsn` and
  `UPTIMER__WORKER__DB__DSN` are no longer read — **still accepted and ignored**, so existing
  configurations keep working. You can delete the setting and drop the second `uptimer_worker`
  database. A worker still needs its `/data` volume for `worker.uuid` and `worker.pem`.

### Security & reliability
- Patched vulnerable dependencies: `golang.org/x/text` and `google.golang.org/grpc`.
- The worker is now a stateless library shared by every build, which removes a class of
  drift between how self-hosted and hosted workers behave.
- Fixed missing icons on the debug page.

## Earlier highlights (1.1 → 1.3.0)

### Packaging
- **The image moved to GitHub Container Registry** —
  [`ghcr.io/myuptime-info/uptimer`](https://github.com/users/myuptime-info/packages/container/package/uptimer).
  Pull a pinned `:X.Y.Z` tag (or `:edge` for pre-releases). The old Docker Hub image is retired.

### Deployment & database
- **New `uptimer migrate` command** plus `server.db.boot_migrate` — run schema migrations as a
  one-shot job and gate rollouts on a fully-migrated database.
- **PostgreSQL migrations are now versioned** (with data backfills) and upgrade-safe; SQLite
  stays auto-migrated for dev. See
  [Choosing a database](/v1.4.0/operating/configuration/#choosing-a-database).

### Running Uptimer
- **`server --services …` replaces the old `run` command** — select services with
  `--services api,ui,grpc,availabilities`.
- New `server.sqids_salt` setting (give it a unique value in production).

### Monitoring
- **Worker-regions management** in the dashboard (still being refined).
- **Assign regions when creating or updating a rule over the API** — the rule payload takes a
  `regions` field (region names), so a headless/[SDK](/v1.4.0/reference/python-sdk/) workflow can
  create a rule that actually runs instead of sitting at "No Data".
- New **`grpc_request_duration_seconds`** metric on [`/metrics`](/v1.4.0/reference/metrics/).

### Extensibility
- A **pluggable architecture** (job registry + route/gRPC extension seams) lets a build add
  services and routes without forking core.

### Fixes & UI
- Smaller CSS payload and a faster dashboard.
- Correct paging on the availability-history view.
- UTF-8 characters render correctly in notifications.
