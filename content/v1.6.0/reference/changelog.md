---
title: "Changelog"
weight: 40
lede: "What changed for users in 1.6.0, and since 1.1."
description: "User-facing changes from 1.1 to 1.6.0."
---

## 1.6.0

### Your own signals
- **Add custom heartbeat and event signals** to an existing website monitoring subject
  (**Monitoring → subject → Signals → Add signal**). A heartbeat reports on a schedule and its
  silence can become no data; an event reports only when something happens and its silence means
  nothing. See [Signals & rules](/v1.6.0/core-concepts/signals-and-rules/).
- **Report observations over the API:**
  `POST /v2/subjects/{subject}/signals/{signal}/observations`, with a Bearer token. A `status`
  of `ok` or `problem`, plus an optional number, error text and your own labels. Retries replace
  rather than double-count. See
  [Report an observation](/v1.6.0/reference/rest-api/#report-an-observation).
- **Platform HTTP signals do not accept posted observations.** That stream is Uptimer's own
  probe, and a posted claim is never mixed in with a measurement.
- A signal a rule reads **cannot be deleted** — the page names the rules and links to them.

### The rules editor
- **Add and edit rules** on a subject (**Monitoring → subject → Rules**). A rule combines the
  platform HTTP signal, your custom signals, and **other rules of the same subject**.
- **Choose what counts as a problem per input:** *Status*, or *Latest value* compared with `<` or
  `>` against one threshold. Platform HTTP is always Status.
- **Select observations by label.** Platform HTTP offers the locations the website form watches,
  plus *Any location* and *Any observation*; custom signals take free-text keys and values, where
  `*` matches any value of a key.
- **Quorum gains "At least N"** beside Any, Majority and All, and **Confirm after**, **Close
  after** and per-input **No data after** are editable.
- **Reachability is edited here too.** Its policy is editable in the same form; it keeps its
  identity and still cannot be deleted.
- A rule shows its policy in plain language on the rule page and in the rules list.

### Monitoring list
- Each row links to that subject's **Signals (N)** and **Rules (N)**, and offers **View rules**.
- **The Website check Edit action is gone.** Creating a website is unchanged; after creation you
  change the subject through Signals and Rules.

### API and SDK
- `POST /v2/subjects/{subject}/signals/{signal}/observations` is the one new endpoint. v1 is
  unchanged and still frozen.
- **Python SDK 1.6.0** adds
  `client.v2.subjects(subject).signals(signal).observations.create(...)` with typed
  request/response models. See [Python SDK](/v1.6.0/reference/python-sdk/#reporting-observations).

## 1.5.0

### Monitoring is the one list
- **Monitoring replaces the checks list** as the workspace home. Each row is a monitoring
  subject with the status of its rules, filtered by **All** or **With incidents**, and links
  straight into that subject's **Timeline**.
- **The old checks list and the per-rule history page are gone.** `/checks` redirects to
  Monitoring, so existing links still land. **Removed with them, and not yet replaced:** the
  uptime history strip and sorting by name, status or up-since.

### Adding a website
- The form is now **Website monitoring**. Saving it creates a **monitoring subject** with one
  built-in HTTP **signal** and one **Reachability rule** — you no longer create those separately.
- **Locations Required to Fail gains "All locations"**, alongside *Majority of locations* and
  *At least one location*. Each location you select becomes one input on the rule. See
  [How many locations must fail](/v1.6.0/core-concepts/monitors-and-incidents/#how-many-locations-must-fail).
- **Creating signals and rules by hand, and custom ingest, are not in this release.** The
  **Add signal** and **Add rule** actions are visible but marked coming soon.

### Seeing why
- **Timeline** — what happened to a subject, newest first, with how long a closed incident lasted.
- **Observation log** — every report each location sent, with a day picker and paging. An
  **Unaccepted** filter shows rows that were stored but not used for a verdict, and why. This is
  what answers "the workers are running but the rule says no data".
- **Rule page** — one input per selected location, what each is reporting, the agreement in
  force, and the confirm/close holds.

### Alerts
- Slack alerts now link to the **subject timeline** instead of a rule's history.
- Monitoring warns when the workspace has **no Slack webhook**: incidents are still detected and
  recorded, but nobody is notified until one is added.

### API and SDK
- **[API v2](/v1.6.0/reference/rest-api/)** speaks the product's language — *locations*,
  *website monitoring*, *incidents* — and is self-contained: a v2 client never needs a v1 route.
  `GET /v2/incidents` answers "what is wrong right now". **API v1 is unchanged and supported** —
  every v1 route, field and `kind` still behaves exactly as it did.
- **A website monitor can now set its location agreement over the API** — the `agreement` field
  (`any`, `majority`, `all`). API v1 has no such field and keeps using `majority`.
- **[Python SDK 1.5.0](/v1.6.0/reference/python-sdk/)** targets v2 only: `client.v2.workspaces`,
  `client.v2.locations`, `client.v2.incidents` and `client.v2.monitoring.websites` replace the
  `client.v1` namespace — the version stays visible, as it did in 0.4.x. Its types are
  versioned with it: `from uptimer.models.v2 import …`, not the flat `uptimer.models`.
  Its version now tracks the server it talks to, and `client.check_compatibility()` refuses a
  server that predates v2 with a message naming the fix. Staying on v1? Pin
  `uptimer-python-sdk<1` — 0.4.x keeps working against a 1.5.0 server.

### API keys
- **A token is shown once, when you create it**, and can be copied from that screen. It cannot be
  viewed again afterwards and there is no regenerate — if you lose it, delete the key and create
  another. Previously the key's page re-issued and displayed a working token on every visit.
- **Keys take an optional description**, so you can tell them apart once the value is hidden.
- **The list shows when each token expires**, and badges a key **Expired** once it is past.
  Keys created before 1.5.0 show no expiry: the page this replaces issued a fresh 180-day token
  every time it was opened, so the expiry of the token you hold is not recoverable.
- **Rotating without downtime is unchanged and still the way to do it:** create the new key,
  switch your client over, then delete the old one. Keys are independent, and deleting one stops
  its token immediately.

### Identifiers
- **The new Monitoring URLs use opaque ids**, and so does the `id` on an API incident — a
  database number is never exposed. Identifiers on existing pages are unchanged. The ids are
  derived from [`server.sqids_salt`](/v1.6.0/operating/configuration/), so changing that value
  invalidates existing Monitoring links.

### Fixed
- Success and error notifications could disappear before they could be read.
- Workspace notification help no longer implies a per-rule notification setting that does not
  exist: notifications are configured per workspace, and once a webhook is set everything in that
  workspace alerts.
- **Security:** a workspace member could read another workspace's monitor configuration, or
  delete it, by using its identifier directly. Deleting it also removed its subject, signal, rule
  and history. All identifier-addressed routes are now scoped to the workspace in the URL.

## 1.4.0

### Incident-based monitoring
- **A monitor's status is now decided across all of its locations**, not by the newest check to
  arrive. The form gains **Locations Required to Fail** — *Majority of locations* (default) or
  *At least one location*. A location that never reports counts as unknown and stays inside the
  decision, so a half-silent monitor reads **No Data** instead of trusting whichever location
  answered. See [Monitors & incidents](/v1.6.0/core-concepts/monitors-and-incidents/#how-many-locations-must-fail).
- **A problem must last 2 minutes before it is confirmed and alerted**, and a recovery must last
  2 minutes before the incident closes. Short blips no longer page you, though they do show up in
  the history.
- **History is now a timeline of incidents** — pending, problem, no data, recovering, closed —
  with the failing and silent locations on each event and the error they reported, replacing the
  old list of individual check results.
- **The monitor list gains two badges** — **Pending** and **Recovering** — shown while a monitor is
  inside one of the 2-minute holds.
- **Slack alerts were rewritten.** Each one now says how many locations are failing and which,
  quotes the error the check returned, and says how long the problem ran before the alert or how
  long the outage lasted. The monitor's URL left the title, and the no-data alert is amber.

### Checks identify themselves
- HTTP(S) checks now send `Uptimer/<version> (+https://uptimer.myuptime.info)` instead of
  `Go-http-client/1.1`, so you can recognise and filter monitoring traffic in logs and analytics.
  The value carries no workspace, worker or location, and is not configurable.

### Logging out ends the provider session
- Signing out now also ends the session at your OIDC provider, so the next login no longer signs
  the same person straight back in. Providers that advertise `end_session_endpoint` need no
  configuration; for the rest, set `server.auth.oidc.end_session_endpoint` and, if it renames the
  return-URL parameter, `server.auth.oidc.post_logout_redirect_param`. See
  [Authentication](/v1.6.0/operating/authentication/#logging-out-of-the-provider).

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
  [Choosing a database](/v1.6.0/operating/configuration/#choosing-a-database).

### Running Uptimer
- **`server --services …` replaces the old `run` command** — select services with
  `--services api,ui,grpc,availabilities`.
- New `server.sqids_salt` setting (give it a unique value in production).

### Monitoring
- **Worker-regions management** in the dashboard (still being refined).
- **Assign regions when creating or updating a rule over the API** — the rule payload takes a
  `regions` field (region names), so a headless/[SDK](/v1.6.0/reference/python-sdk/) workflow can
  create a rule that actually runs instead of sitting at "No Data".
- New **`grpc_request_duration_seconds`** metric on [`/metrics`](/v1.6.0/reference/metrics/).

### Extensibility
- A **pluggable architecture** (job registry + route/gRPC extension seams) lets a build add
  services and routes without forking core.

### Fixes & UI
- Smaller CSS payload and a faster dashboard.
- Correct paging on the availability-history view.
- UTF-8 characters render correctly in notifications.
