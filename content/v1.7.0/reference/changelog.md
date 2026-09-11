---
title: "Changelog"
weight: 40
lede: "What changed for users in 1.6.0, and since 1.1."
description: "User-facing changes from 1.1 to 1.6.0."
---

## 1.7.0

### Acknowledging an incident
- **Acknowledge** an open incident from the subject's page — where you land from Monitoring —
  or from a rule page. The timeline records who acknowledged it and when, so the next person
  to look can see somebody is already on it. See
  [Monitors & incidents](/v1.7.0/core-concepts/monitors-and-incidents/#acknowledging-an-incident).
- **One incident per press.** A subject page acts on the worst of its open incidents, by the
  same order its status reads by, and names the rule on a Custom subject. It never
  acknowledges the rest.
- **Monitoring shows an acknowledged problem.** A subject's row carries an **Acknowledged**
  badge beside its status while the acknowledged incident is a confirmed problem, and loses it
  once that incident recovers or closes.
- **It changes nothing about the incident.** The verdict, the evidence and the locations are
  untouched, the close wait carries on, and recovery and closure happen as they would have.
  Alerting is unchanged: acknowledging does not silence anything.
- **Recorded once.** The first acknowledgement is the one that is kept — pressing it again
  adds no second row and does not replace the original name or time. Acknowledging requires
  edit access, and a closed incident cannot be newly acknowledged.

### Reliability
- **Server services survive a database outage.** A server that cannot reach its database now
  waits and retries — immediately, then after 5s, 15s, 30s, and every 60s after that — instead
  of exiting on the first refusal, and picks up again when the database returns without a
  restart. Availability checks pause for the outage rather than piling up, and a stop is still
  immediate. `uptimer migrate` is deliberately unchanged: it still fails immediately, so a
  rollout gated on it fails rather than hangs.

## 1.6.0

### Custom checks
- **Add Custom check** creates a monitoring subject of your own, with nothing under it — no URL,
  no probe, no interval. It sits in the Monitoring list beside your website checks, and each row
  now says which kind it is. See [Signals & rules](/v1.7.0/core-concepts/signals-and-rules/).
- **Add custom heartbeat and event signals** to a Custom subject
  (**Monitoring → the subject → Signals → Add signal**). A heartbeat reports on a schedule and
  its silence can become no data; an event reports only when something happens and its silence
  means nothing.
- **A Website check keeps its own shape.** Its HTTP signal and its Reachability rule are created
  and rewritten by the check form, so it has no Add signal and no Add rule — you change it by
  editing the check. Custom signals and custom rules live on Custom subjects.
- **Report observations over the API:**
  `POST /v2/subjects/{subject}/signals/{signal}/observations`, with a Bearer token. A `status`
  of `ok` or `problem`, plus an optional number, error text and your own labels. Retries replace
  rather than double-count. See
  [Report an observation](/v1.7.0/reference/rest-api/#report-an-observation).
- **Platform HTTP signals do not accept posted observations.** That stream is Uptimer's own
  probe, and a posted claim is never mixed in with a measurement.
- A signal a rule reads **cannot be deleted** — the page names the rules and links to them.

### The rules editor
- **Add and edit rules** on a Custom subject (**Monitoring → the subject → Rules**). A rule
  combines that subject's signals and **other rules of the same subject**; cross-subject inputs
  are not possible.
- **Choose what counts as a problem per input:** *Status*, or *Latest value* compared with `<` or
  `>` against one threshold.
- **Select observations by label** — free-text keys and values, where `*` matches any value of a
  key.
- **Quorum gains "At least N"** beside Any, Majority and All, and **Confirm after**, **Close
  after** and per-input **No data after** are editable.
- **Reachability is not edited here.** A website check's rule stays owned by the check form: its
  inputs are the locations it watches and its quorum is *Locations Required to Fail*, so it is
  changed by editing the check. It can be read, and it still cannot be deleted.
- A rule shows its policy in plain language on the rule page and in the rules list.

### Monitoring list
- Each row is labelled **Website** or **Custom**. A Custom row links to that subject's
  **Signals (N)** and **Rules (N)** and offers **View rules**; a Website row keeps **Edit**,
  which opens the website monitoring form.
- **Delete removes a subject and its history**, of either kind.

### API and SDK
- **A whole Custom subject can be built over the API.** `/v2/subjects` lists, fetches and
  creates Custom subjects; `/v2/subjects/{subject}/signals` and
  `/v2/subjects/{subject}/rules` add, read, change and remove the signals and the rules under
  one; `/v2/subjects/{subject}/signals/{signal}/observations` reports the readings. The API
  offers what the Custom screens offer. See
  [the v2 reference](/v1.7.0/reference/rest-api/#list-custom-subjects).
- **The API is split by subject kind.** Website monitoring is `/v1/rules` and its
  `/v2/monitoring/websites` alias; custom monitoring is `/v2/subjects`. Neither serves the
  other's subjects: a website subject is refused on every `/v2/subjects` route, and a subject
  being maintained by hand leaves the website listing and refuses website writes. Ordinary
  website monitors are unaffected, and v1 is otherwise unchanged and still frozen. See
  [The API is split by subject kind](/v1.7.0/reference/rest-api/#the-api-is-split-by-subject-kind).
- Subjects created before 1.6.0 are classified once, on upgrade: one that already carried a
  hand-made signal or rule is Custom; everything else is Website.
- **Python SDK 1.6.0** adds `client.v2.subjects.all(...)` / `.get(...)` / `.create(...)` and
  `client.v2.subjects(subject).signals(signal).observations.create(...)`, with typed
  request/response models. Authoring signals and rules over the API is not in the SDK yet —
  call those routes directly. See [Python SDK](/v1.7.0/reference/python-sdk/#subjects).

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
  [How many locations must fail](/v1.7.0/core-concepts/monitors-and-incidents/#how-many-locations-must-fail).
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
- **[API v2](/v1.7.0/reference/rest-api/)** speaks the product's language — *locations*,
  *website monitoring*, *incidents* — and is self-contained: a v2 client never needs a v1 route.
  `GET /v2/incidents` answers "what is wrong right now". **API v1 is unchanged and supported** —
  every v1 route, field and `kind` still behaves exactly as it did.
- **A website monitor can now set its location agreement over the API** — the `agreement` field
  (`any`, `majority`, `all`). API v1 has no such field and keeps using `majority`.
- **[Python SDK 1.5.0](/v1.7.0/reference/python-sdk/)** targets v2 only: `client.v2.workspaces`,
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
  derived from [`server.sqids_salt`](/v1.7.0/operating/configuration/), so changing that value
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
  answered. See [Monitors & incidents](/v1.7.0/core-concepts/monitors-and-incidents/#how-many-locations-must-fail).
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
  [Authentication](/v1.7.0/operating/authentication/#logging-out-of-the-provider).

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
  [Choosing a database](/v1.7.0/operating/configuration/#choosing-a-database).

### Running Uptimer
- **`server --services …` replaces the old `run` command** — select services with
  `--services api,ui,grpc,availabilities`.
- New `server.sqids_salt` setting (give it a unique value in production).

### Monitoring
- **Worker-regions management** in the dashboard (still being refined).
- **Assign regions when creating or updating a rule over the API** — the rule payload takes a
  `regions` field (region names), so a headless/[SDK](/v1.7.0/reference/python-sdk/) workflow can
  create a rule that actually runs instead of sitting at "No Data".
- New **`grpc_request_duration_seconds`** metric on [`/metrics`](/v1.7.0/reference/metrics/).

### Extensibility
- A **pluggable architecture** (job registry + route/gRPC extension seams) lets a build add
  services and routes without forking core.

### Fixes & UI
- Smaller CSS payload and a faster dashboard.
- Correct paging on the availability-history view.
- UTF-8 characters render correctly in notifications.
