---
title: "REST API"
weight: 10
lede: "The API the dashboard is built on. Base /api, always HTTP 200, envelope responses."
description: "REST API reference — endpoints, auth, schemas, errors."
---

Base URL: **`http://<host>:2517/api`** — the API is served under `/api` on the web UI port.

## Conventions

- **Every response is HTTP `200`** with a `{ "result", "error", "meta" }` envelope — check
  `error`, not the status code.
- On success `error` is `null` and `result` holds the data; on failure `result` is `null` and
  `error` is filled.
- Objects carry a `kind` field (`website_monitor`, `workspace`, `location`, …).

## Two versions

**v2 is the current API** and uses the product's language: *locations*, *website
monitoring*, *incidents*. It is self-contained — a v2 client never needs a v1 route.

**v1 is frozen and still supported.** Every v1 route, field and `kind` is unchanged,
so existing clients keep working with no modification. v1 says *regions* and *rules*
where v2 says *locations* and *website monitors*; the underlying objects are the same.

New integrations should use v2.

## Auth

**Every endpoint needs a Bearer API key** — a token minted in the dashboard
(**User → API Keys**). That includes `GET /version`: a request with no
`Authorization` header answers `Missing Authorization header` (code `1001`), never a
version.

```sh
curl -H "Authorization: Bearer $UPTIMER_API_KEY" \
  "http://localhost:2517/api/v2/monitoring/websites?workspace_id=<uid>"
```

The token is shown **once**, on the screen that creates it, and is valid for **180
days** — see [API keys](/v1.7.0/operating/authentication/#api-keys-rest-api) for
rotation. A key can only reach the workspaces its owner is a member of; anything
else answers `Access denied`.

## Endpoints (v2)

Every row links to that method's own section.

| Method | Path | Purpose |
|---|---|---|
| GET | [`/version`](#get-the-server-version) | Server version (string). Shared by v1 and v2. |
| GET | [`/v2/workspaces`](#list-workspaces-v2) | Your workspaces, each with your role. |
| GET | [`/v2/locations`](#list-locations) | Locations + active worker counts. |
| GET | [`/v2/incidents`](#list-open-incidents) | **Open** incidents, newest trouble first. |
| GET | [`/v2/monitoring/websites`](#list-website-monitors) | List website monitors. |
| POST | [`/v2/monitoring/websites`](#create-a-website-monitor) | Create a website monitor. |
| GET | [`/v2/monitoring/websites/{id}`](#get-a-website-monitor) | Get one. |
| POST | [`/v2/monitoring/websites/{id}`](#update-a-website-monitor) | Update one (there is no `PUT`). |
| DELETE | [`/v2/monitoring/websites/{id}`](#delete-a-website-monitor) | Delete one. |
| GET | [`/v2/subjects`](#list-custom-subjects) | The workspace's **Custom** subjects. |
| POST | [`/v2/subjects`](#create-a-custom-subject) | Create one empty Custom subject. |
| GET | [`/v2/subjects/{subject}`](#get-a-custom-subject) | Get one by its slug. |
| GET | [`/v2/subjects/{subject}/signals`](#list-signals) | The subject's signals. |
| POST | [`/v2/subjects/{subject}/signals`](#create-a-signal) | Add one custom signal. |
| GET | [`/v2/subjects/{subject}/signals/{signal}`](#get-a-signal) | Get one. |
| POST | [`/v2/subjects/{subject}/signals/{signal}`](#update-a-signal) | Rename it and replace its meta. |
| DELETE | [`/v2/subjects/{subject}/signals/{signal}`](#delete-a-signal) | Delete it and its observations. |
| GET | [`/v2/subjects/{subject}/rules`](#list-subject-rules) | The subject's incident rules. |
| POST | [`/v2/subjects/{subject}/rules`](#author-a-rule) | Author one rule. |
| GET | [`/v2/subjects/{subject}/rules/{rule}`](#get-a-subject-rule) | Get one. |
| POST | [`/v2/subjects/{subject}/rules/{rule}`](#update-a-subject-rule) | Replace its name and policy. |
| DELETE | [`/v2/subjects/{subject}/rules/{rule}`](#delete-a-subject-rule) | Delete it. |
| POST | [`/v2/subjects/{subject}/signals/{signal}/observations`](#report-an-observation) | Report one observation to a custom signal. |
| GET | [`/v2/subjects/{subject}/incidents`](#list-a-custom-subjects-open-incidents) | That subject's **open** incidents, with their ids. |
| POST | [`/v2/subjects/{subject}/incidents/{incident}/acknowledge`](#acknowledge-a-custom-incident) | Say you have seen one open **Custom** incident. |

### The API is split by subject kind

There are two kinds of [subject](/v1.7.0/core-concepts/signals-and-rules/), and each has one
API of its own.

- **Website monitoring** is served by [`/v1/rules`](#list-rules) and by
  [`/v2/monitoring/websites`](#list-website-monitors), which is the same resource under a v2
  path — the same services, the same validation, plus the `agreement` field. Website
  monitoring is a built-in **template**, which is why it sits under `/v2/monitoring/` rather
  than at `/v2/monitors`; that name is reserved for the general model.
- **Custom monitoring** is served by `/v2/subjects` and everything nested under it: the
  subject, its signals, its rules and its observation intake. This is the API half of the
  Custom screens in the dashboard, and it offers what they offer.

**Neither one serves the other's subjects.** `GET /v2/subjects` lists Custom subjects only,
and a website subject answers `Website subjects are managed elsewhere` (code `2004`) on every
`/v2/subjects` route — read, signal, rule and observation alike. In the other direction, a
subject that is being maintained by hand is no longer the website API's to serve: it drops out
of the website listing, and reading, updating or deleting its monitor answers
`Custom subjects are managed elsewhere` (code `2004`), naming the `/v2/subjects` path to use
instead. Ordinary website monitors are unaffected.

A subject becomes Custom the moment it is given its first custom signal or authored rule, and
never goes back. Subjects created before 1.6.0 are classified once, on upgrade: one that
already carried a hand-made signal or rule is Custom, and everything else is Website.

There is no `PUT`, no update and no `DELETE` for a subject itself: deleting one takes its whole
history with it, so it is a dashboard action rather than a script's.

## Endpoints (v1, frozen)

| Method | Path | Purpose |
|---|---|---|
| GET | [`/v1/workspaces`](#list-workspaces-v1) | Your workspaces, each with your role. |
| GET | [`/v1/rules`](#list-rules) | List rules in a workspace. |
| POST | [`/v1/rules`](#create-a-rule) | Create a rule. |
| GET | [`/v1/rules/{uid}`](#get-a-rule) | Get one rule. |
| POST | [`/v1/rules/{uid}`](#update-a-rule) | Update a rule. |
| DELETE | [`/v1/rules/{uid}`](#delete-a-rule) | Delete a rule. |
| POST | [`/v1/rules/{uid}/incidents/{incident}/acknowledge`](#acknowledge-a-website-incident) | Say you have seen one open **Website** incident. |
| GET | [`/v1/regions`](#list-regions) | List regions + active worker counts. |

## Shared payloads

These schemas are referenced by more than one method, so they are written once here.

### Website monitor object (v2)

```json
{
  "name": "home",
  "interval": 60,
  "workspace_id": "<uid>",
  "request":  { "url": "https://example.com", "method": "GET", "content_type": "application/json", "data": "" },
  "response": { "statuses": [200], "body": { "content": "" } },
  "locations": ["local"],
  "agreement": "majority"
}
```

- `method` is one of `GET`, `POST`, `PATCH`, `OPTIONS`.
- `interval` is seconds, in whole minutes (≥ 60) — anything not divisible by 60 is a
  validation error.
- `locations` is a list of location **names** (as listed by
  [`GET /v2/locations`](#list-locations)). An unknown name is a validation error. Omit
  or leave it empty for **no location** — the monitor is then never checked and stays
  at no data, see [Locations](/v1.7.0/core-concepts/locations/).
- `agreement` is how many locations must report a problem before the monitor does:
  `any`, `majority` or `all`. Any other value is refused with `invalid agreement`
  **before anything is written**.
- `name`, `interval`, `request.url`, `request.method` and `response.statuses` are
  required. An empty `content_type` is stored as `application/json`.
- `body.content` is an optional literal substring the response must contain; empty
  means "don't check the body".

The response is the stored monitor: the same fields plus `id`, and a `kind` on every
object (`website_monitor`, `website_monitor_request`, `website_monitor_response`,
`website_monitor_response_body`). `kind` is the server telling you what an object is —
you never send it back, and it is ignored if you do. `locations` always comes back as a
list, never `null`.

### Incident object (v2)

```json
{
  "id": "v8dLj9O1tzs",
  "monitor_id": "<uid>",
  "monitor_name": "home",
  "status": "problem",
  "trouble_since": "2026-08-20T18:21:37Z",
  "confirmed_at": "2026-08-20T18:24:37Z",
  "well_since": null,
  "locations": { "failing": ["local"], "unknown": [], "ok": [] },
  "kind": "incident"
}
```

- `id` is an **opaque id**, not a database number. It is derived from
  [`server.sqids_salt`](/v1.7.0/operating/configuration/) — change that value and
  previously-returned ids no longer resolve.
- `trouble_since` is the first non-ok tick: the incident's real start.
- `confirmed_at` is `null` while the incident is `pending` — the confirm hold gates the
  notification, not the incident.
- `well_since` is `null` unless the incident is `recovering`.

`status` uses the same words the dashboard shows, so the API and the screen cannot
disagree:

| status | meaning |
|---|---|
| `problem` | confirmed; notifications have gone out |
| `pending` | failing, but inside the confirm hold — **nobody has been notified yet** |
| `recovering` | reporting ok again while the incident is still open |
| `no_data` | nothing usable arrived |
| `ok` | healthy |

`locations` is the evidence the verdict came from. A location that has never reported
stays in `unknown` and still counts toward the agreement — that is a real state, not a
missing one.

### Subject incident object (v2)

One open incident of a **Custom** subject, returned by
[list a custom subject's open incidents](#list-a-custom-subjects-open-incidents).

```json
{
  "id": "xeOkfGadru8",
  "subject_id": "payments-worker",
  "rule_id": "export-health",
  "rule_name": "Export health",
  "status": "problem",
  "trouble_since": "2026-09-12T10:47:45Z",
  "confirmed_at": "2026-09-12T10:47:45Z",
  "well_since": null,
  "acknowledged": true,
  "acknowledged_at": "2026-09-12T11:47:45Z",
  "acknowledged_by": "ops",
  "kind": "subject_incident"
}
```

It is **not** the [incident object](#incident-object-v2) above: that one describes a website
monitor's incident and carries `monitor_id`, `monitor_name` and the locations the probe ran
from. A custom incident has none of those, so instead of inventing them this object names the
**rule** that opened it — `rule_id` is the rule's slug, `rule_name` the name you gave it.

- `id` is the value the [acknowledge](#acknowledge-a-custom-incident) method takes.
- `status` uses [the same five words](#incident-object-v2) as everywhere else.
- `acknowledged_by` is `""` and `acknowledged_at` `null` while nobody has acknowledged it.

### Incident acknowledgement object

The answer to both [acknowledge](#acknowledging-an-incident) methods. One shape for both
families: what differs is only how the incident was addressed.

```json
{
  "incident_id": "xeOkfGadru8",
  "monitor_id": "<uid>",
  "status": "problem",
  "acknowledged": true,
  "acknowledged_at": "2026-09-12T11:30:57Z",
  "acknowledged_by": "ops",
  "recorded": true,
  "trouble_since": "2026-09-12T10:30:57Z",
  "confirmed_at": "2026-09-12T10:30:57Z",
  "well_since": null,
  "closed_at": null,
  "kind": "incident_acknowledgement"
}
```

- `monitor_id` is present on a **Website** answer. A **Custom** answer carries `subject_id`
  and `rule_id` — the subject's slug and the slug of the rule the incident belongs to —
  instead. The other family's field is absent, not empty.
- `acknowledged_by` is the display name, or the username where there is none: the same name
  the dashboard timeline shows.
- **`recorded` says whether *this* call wrote the acknowledgement.** `false` means it was
  already acknowledged and nothing changed — the call succeeded, no second history entry was
  added, and `acknowledged_at` / `acknowledged_by` are the **first** person's.
- `status` is the incident's condition, unchanged by acknowledging it. A closed incident has
  no current condition, so it reads `ok`; `closed_at` is what tells you it closed.

### Subject object (v2)

One thing a workspace watches, returned by the [subject](#list-custom-subjects) methods.

```json
{
  "id": "payments-worker",
  "name": "Payments worker",
  "subject_kind": "custom",
  "workspace_id": "<uid>",
  "signal_count": 1,
  "rule_count": 1,
  "kind": "subject"
}
```

| Field | Meaning |
|---|---|
| `id` | The subject's **slug** — what the API addresses it by, and the first half of the observation route. There is no database id in the payload, and renaming the subject does not move it. |
| `subject_kind` | `website` or `custom`. How the subject is configured, and therefore what may be done to it. |
| `signal_count`, `rule_count` | How much is under the subject. There is no signals or rules collection, so these are how you see that a new Custom subject really is empty. |
| `kind` | Always `"subject"`. |

`kind` and `subject_kind` are separate on purpose: `kind` says **what** the object is, so a
client switching on it keeps working when a third subject kind arrives; `subject_kind` says how
this particular one is configured. On these routes it is always `custom` — a website subject is
[served by the website API](#the-api-is-split-by-subject-kind) and refused here.

### Signal object (v2)

One signal of a Custom subject, returned by the [signal](#list-signals) methods.

```json
{
  "id": "worker-pulse",
  "name": "Worker pulse",
  "signal_kind": "custom_heartbeat",
  "subject_id": "payments-worker",
  "workspace_id": "<uid>",
  "meta": {},
  "kind": "signal"
}
```

| Field | Meaning |
|---|---|
| `id` | The signal's **slug** — the address a sender posts to, and what a rule input cites. A rename never moves it. |
| `signal_kind` | `custom_heartbeat` or `custom_event`. Fixed at creation. |
| `meta` | Any JSON object, stored and returned untouched. Uptimer never reads a key out of it. |

### Rule object (v2)

One operator-authored incident rule of a Custom subject, returned by the
[rule](#list-subject-rules) methods. It is deliberately **not** the
[v1 rule object](#rule-object-v1-frozen), which describes a website probe.

```json
{
  "id": "export-health",
  "name": "Export health",
  "subject_id": "payments-worker",
  "workspace_id": "<uid>",
  "policy_version": 1,
  "document": {
    "inputs": [
      { "signal": "worker-pulse", "mode": "status", "no_data_after": "5m0s" },
      { "signal": "queue-depth", "mode": "latest_value", "compare": ">", "threshold": 1000 },
      { "from": "queue-health" }
    ],
    "decision": { "state": "down", "need": "any" },
    "wait": { "confirm_after": "2m0s", "close_after": "2m0s" }
  },
  "kind": "subject_rule"
}
```

| Field | Meaning |
|---|---|
| `id` | The rule's **slug** — what another rule cites with `from`, and what the nested routes address. A rename never moves it. |
| `policy_version` | Incremented on every saved policy. The stored document is kept per version, so a past verdict can be read back against the policy that produced it. |
| `document` | The policy itself, below. |

**`document.inputs`** enumerates what the rule reads. Each input sets **exactly one** of:

- `signal` — the slug of one of the subject's own signals.
- `from` — the slug of another rule of the same subject. Its verdict is the input: problem is
  true, ok is false, no data is unknown.

Cross-subject inputs are not possible — a subject is the boundary — and a signal or rule an
input cites cannot be deleted while it does.

A **signal** input takes:

| Field | Meaning |
|---|---|
| `mode` | `status` (the latest selected observation reports `problem`) or `latest_value` (its numeric `value` is compared). Required. |
| `compare`, `threshold` | `<` or `>` and one number. `latest_value` only. An observation with no number is unknown rather than false. |
| `match` | AND-ed equality on the observation's labels. `"*"` means the key must be present with any value; no entries selects the whole signal. |
| `no_data_after` | A duration string (`"5m"`, `"2m0s"`) — how long this input may stay silent before it counts as unknown. Omit or `0s` to derive it from the interval. Meaningless on an event signal and on a `from` input. |

**`document.decision`** is `{"state": "down", "need": …}` — `state` is always `down` in this
release, and `need` is `any`, `majority`, `all` or `at_least` with `at_least: N`.

**`document.wait`** is `confirm_after` (how long a problem must last before the incident is
confirmed and anyone is alerted — the incident opens on the first bad tick regardless) and
`close_after` (how much continuous recovery closes it). Both are duration strings and both
default to `"2m0s"`.

Durations are **strings**, not numbers of seconds, so a stored policy reads the way an operator
would write it.

### Observation object (v2)

What the server stored, returned by [report an observation](#report-an-observation).

```json
{
  "subject_id": "payments-worker",
  "signal_id": "worker-pulse",
  "observed_at": "2026-09-01T12:00:00Z",
  "received_at": "2026-09-01T12:00:01Z",
  "status": "ok",
  "value": 1.5,
  "error": "",
  "labels": { "instance": "worker-3" },
  "accepted": true,
  "reject_reason": "accepted",
  "kind": "observation"
}
```

| Field | Meaning |
|---|---|
| `subject_id`, `signal_id` | The two slugs you addressed, echoed back. |
| `observed_at` | When **you** say you observed it. Omitted on the request, the server stamps now. |
| `received_at` | When the server stored it. The pair explains a late or skewed report. |
| `status` | `ok` or `problem`, as sent. |
| `value` | The optional number, or `null`. |
| `labels` | Your labels, as sent. |
| `accepted` | Whether evaluation may use this row. |
| `reject_reason` | `accepted`, or why not: `clock_skew`, `late`, `out_of_order`, `out_of_retention`. |

`accepted` reports **acceptance, not health**: it says Uptimer stored the observation and may
evaluate it, not that anything is fine or broken. Whether a `problem` raises an incident is
decided by a [rule](/v1.7.0/core-concepts/signals-and-rules/#rules), and a signal no rule reads
raises nothing at all.

### Rule object (v1, frozen)

```json
{
  "name": "home",
  "interval": 60,
  "workspace_id": "<uid>",
  "request":  { "url": "https://example.com", "method": "GET", "content_type": "application/json", "data": "" },
  "response": { "statuses": [200], "body": { "content": "" } },
  "regions":  ["local"]
}
```

Same field rules as the [website monitor object](#website-monitor-object-v2), with
`regions` in place of `locations`. v1 has no `agreement` field: a rule created through
v1 uses the default, `majority`.

The response adds `id` and carries the v1 kinds — `rule`, `rule_request`,
`rule_response`, `rule_response_body`.

## v2 methods

### Get the server version

**`GET /version`**

No parameters, no body. `result` is a plain JSON string:

```json
{ "result": "1.6.0", "error": null, "meta": null }
```

Not versioned — it is shared by v1 and v2, so a client can read it before it knows
which API versions the server has. It still needs a Bearer token like every other
endpoint. It is the one route registered outside the API-key lookup: the token is
validated, but the key record behind it is not loaded.

### List workspaces (v2)

**`GET /v2/workspaces`**

No parameters, no body. Returns every workspace the key's owner is a member of, each
with that member's role:

```json
[{ "id": "<uid>", "name": "Default", "role": "owner", "kind": "workspace" }]
```

`role` is `owner`, `editor` or `viewer`. This is a path alias over the v1 handler — its
payload is already in v2's vocabulary — so a v2 client never has to call `/v1`.

### List locations

**`GET /v2/locations`**

No parameters, no body. Returns every location on the instance with how many workers
are currently serving it:

```json
[{ "id": "<uid>", "name": "eu-west", "active_workers_count": 0, "kind": "location" }]
```

Use `name` when assigning locations to a monitor — the create and update payloads match
by name, not by id. `active_workers_count` is `0` for a location no worker is serving;
a monitor assigned only to such a location has nothing reporting for it.

### List open incidents

**`GET /v2/incidents?workspace_id=<uid>`**

| Parameter | Required | Meaning |
|---|---|---|
| `workspace_id` | yes | The workspace to read. Missing → `Missing workspace ID` (code `2004`). |
| `monitor_id` | no | Narrow the answer to one website monitor. |

Returns a list of [incident objects](#incident-object-v2), newest `trouble_since`
first — it answers "what is wrong now".

**Open incidents only.** Closed incidents are history and live on the subject timeline
in the dashboard; there is no incident-history endpoint in this release. A monitor that
has never been evaluated has nothing open and simply does not appear, and a workspace
with nothing wrong answers `[]`.

A key whose owner is not a member of that workspace gets `Access denied` (code `2005`).

### List website monitors

**`GET /v2/monitoring/websites?workspace_id=<uid>`**

| Parameter | Required | Meaning |
|---|---|---|
| `workspace_id` | yes | The workspace to read. Missing → `Missing workspace ID` (code `2004`). |

Returns a list of stored [website monitor objects](#website-monitor-object-v2), each
with its `id`, its `locations` and its `agreement`. A non-member gets `Access denied`
(code `2005`).

### Create a website monitor

**`POST /v2/monitoring/websites`**

Body: a [website monitor object](#website-monitor-object-v2) without `id`.

- `workspace_id` is **required** — it is what decides where the monitor is created.
- `locations` assigns the monitor; omit it for none, and it is never checked.
- `agreement` is optional. Omitted, it is created with the default `majority`, which is
  what the dashboard form pre-selects.

Returns the stored monitor, so the `id` to address it with comes back in the response.

Saving a website monitor also creates its **monitoring subject**, its built-in HTTP
**signal** and its **Reachability rule** — you do not create those separately, and they
are in place before the response is written, so a monitor created here behaves exactly
like one created in the form.

An unknown location name answers `invalid locations` / `Unknown location: "…"` (code
`2001`), and nothing is written.

### Get a website monitor

**`GET /v2/monitoring/websites/{id}`**

`{id}` is the monitor's `id`, as returned by
[create](#create-a-website-monitor) or [list](#list-website-monitors). No body.

Returns one stored [website monitor object](#website-monitor-object-v2). An id that
does not exist, or one in a workspace the key cannot reach, answers
`Website monitor not found` (code `2002`) — the two are deliberately indistinguishable.

### Update a website monitor

**`POST /v2/monitoring/websites/{id}`** — there is no `PUT`.

Body: a [website monitor object](#website-monitor-object-v2) without `id`. The update
is a **full replacement**, not a patch: send the whole configuration, because anything
you leave out is not kept.

Three fields behave differently from create:

- `workspace_id` is **ignored**. A monitor cannot change workspace.
- `locations` **replaces** the stored list, so include the ones you want to keep.
  Omitting it, or sending `[]`, clears them and the monitor stops being checked.
- `agreement` **omitted keeps the stored value** — an update that does not mention it
  will not silently reset it to `majority`.

Returns the stored monitor. An id that does not exist answers `Website monitor not
found` (code `2002`).

### Delete a website monitor

**`DELETE /v2/monitoring/websites/{id}`**

No body. Requires an **editor or owner** role in the monitor's workspace; a viewer gets
`Access denied` (code `2005`).

```json
{ "message": "Website monitor deleted successfully", "monitor_id": "<uid>" }
```

This removes the monitor **and everything under it** — its monitoring subject, its
signal, its rule and their history. Deleting an id that is already gone answers
`Website monitor not found` (code `2002`).

### List custom subjects

**`GET /v2/subjects?workspace_id=<uid>`**

| Parameter | Required | Meaning |
|---|---|---|
| `workspace_id` | yes | The workspace to read. Missing → `Missing workspace ID` (code `2004`). |

Returns the workspace's **Custom** [subject objects](#subject-object-v2), each with its
`signal_count` and `rule_count`. Website subjects are not here — they are
[the website API's](#list-website-monitors). A non-member gets `Access denied` (code `2005`).

### Create a custom subject

**`POST /v2/subjects`**

```json
{ "workspace_id": "<uid>", "name": "Payments worker" }
```

| Field | Required | Meaning |
|---|---|---|
| `workspace_id` | yes | Where the subject is created. |
| `name` | yes | Must contain at least one letter or digit; it produces the slug. |
| `subject_kind` | no | May only say `"custom"`. It exists so a client that sends the field is answered rather than surprised. |

Returns the stored [subject object](#subject-object-v2). The subject arrives **empty** —
`signal_count` and `rule_count` are `0`, and it has no HTTP probe. Give it a
[signal](#create-a-signal), then a [rule](#author-a-rule) that reads it, then
[report observations](#report-an-observation).

A colliding name is not refused: two subjects may legitimately be called the same thing, so the
slug is disambiguated (`payments-worker-2`). The address is not the name, and a later rename
never moves it.

Unknown fields are refused rather than dropped, so a body carrying `url` or `interval` answers
`Invalid JSON` (code `2006`) instead of quietly creating something that probes nothing.

**Website monitoring is not created here.** `subject_kind: "website"` answers
`Website subjects are created elsewhere` (code `2004`), pointing at
[`POST /v1/rules`](#create-a-rule) and its
[`/v2/monitoring/websites`](#create-a-website-monitor) alias.

Creating requires the workspace **editor** role; a viewer gets `Access denied` (code `2005`).

### Get a custom subject

**`GET /v2/subjects/{subject_slug}`**

`{subject_slug}` is the subject's `id`. Returns one [subject object](#subject-object-v2).

| Parameter | Required | Meaning |
|---|---|---|
| `workspace_id` | no | Settles an ambiguity rather than being required. |

A subject slug is unique **per workspace**, not globally, so without `workspace_id` the server
searches the workspaces you belong to. Nothing found answers `Subject not found` (code `2002`) —
the same answer a subject you cannot see gives. The same slug in two of your workspaces answers
`Ambiguous subject` (code `2004`), naming them, so you can add the parameter.

A website subject answers `Website subjects are managed elsewhere` (code `2004`). Reading a
custom one needs only the **viewer** role: it is what you can already see in the dashboard.

## Custom signals

Every route below is nested under a **Custom** subject, and every one of them refuses a website
subject with `Website subjects are managed elsewhere` (code `2004`). Reads need the **viewer**
role; writes need **editor**.

### List signals

**`GET /v2/subjects/{subject_slug}/signals`**

Returns the subject's [signal objects](#signal-object-v2). A subject you just created has none.

### Create a signal

**`POST /v2/subjects/{subject_slug}/signals`**

```json
{ "name": "Worker pulse", "kind": "custom_heartbeat", "meta": { "team": "payments" } }
```

| Field | Required | Meaning |
|---|---|---|
| `name` | yes | Must contain at least one letter or digit; it produces the slug. |
| `kind` | yes | `custom_heartbeat` or `custom_event` (`heartbeat` and `event` are accepted spellings). Fixed once created. |
| `meta` | no | Any JSON object, stored and returned untouched. |

Returns the stored [signal object](#signal-object-v2). Choosing between heartbeat and event is
choosing what your silence means — see
[Signals & rules](/v1.7.0/core-concepts/signals-and-rules/#signals).

| Answer | When |
|---|---|
| `Invalid signal kind` (code `2001`) | `kind` is missing or is not one of the four accepted words. A platform HTTP signal cannot be authored. |
| `Invalid name` (code `2001`) | The name has no letter or digit. |
| `Signal name taken` (code `2001`) | Another signal on this subject already has that slug. |
| `Invalid meta` (code `2001`) | `meta` is not a JSON object. |

### Get a signal

**`GET /v2/subjects/{subject_slug}/signals/{signal_slug}`**

Returns one [signal object](#signal-object-v2), or `Signal not found` (code `2002`).

### Update a signal

**`POST /v2/subjects/{subject_slug}/signals/{signal_slug}`** — there is no `PUT`.

```json
{ "name": "Worker heartbeat", "meta": {} }
```

Renames the signal and **replaces** its `meta`. `kind` and the slug are immutable: senders are
already posting to that address, so a rename never moves it.

A built-in signal — the platform HTTP one a website monitor maintains — answers
`Signal is managed by Website monitoring` (code `2003`).

### Delete a signal

**`DELETE /v2/subjects/{subject_slug}/signals/{signal_slug}`**

```json
{ "message": "Signal deleted successfully", "signal_id": "worker-pulse", "subject_id": "payments-worker" }
```

This removes the signal **and its observations**. A signal a rule reads answers
`Signal is still used by a rule` (code `2003`): retarget or remove those rules first. Uptimer
never unlinks a rule on its own, because that would quietly change what the rule watches in
order to complete an unrelated delete.

## Custom rules

The same nesting, the same roles, the same cross-kind refusal as the signal routes above.

### List subject rules

**`GET /v2/subjects/{subject_slug}/rules`**

Returns the subject's [rule objects](#rule-object-v2), each with its policy document.

### Author a rule

**`POST /v2/subjects/{subject_slug}/rules`**

```json
{
  "name": "Export health",
  "document": {
    "inputs": [{ "signal": "worker-pulse", "mode": "status", "no_data_after": "5m" }],
    "decision": { "state": "down", "need": "any" },
    "wait": { "confirm_after": "2m", "close_after": "2m" }
  }
}
```

Returns the stored [rule object](#rule-object-v2) at `policy_version: 1`. Every input must cite
a signal or a rule **of this subject** — add the signals first.

| Answer | When |
|---|---|
| `Invalid name` (code `2001`) | The name has no letter or digit. |
| `Rule name taken` (code `2001`) | Another rule on this subject already has that slug. |
| `Unknown input` (code `2001`) | An input cites a signal or rule this subject does not have. |
| `Invalid input mode` (code `2001`) | Neither or both of `status` and `latest_value`, or a mode on a rule input. |
| `Invalid rule document` (code `2001`) | The document is otherwise not a valid policy. |

### Get a subject rule

**`GET /v2/subjects/{subject_slug}/rules/{rule_slug}`**

Returns one [rule object](#rule-object-v2), or `Rule not found` (code `2002`).

### Update a subject rule

**`POST /v2/subjects/{subject_slug}/rules/{rule_slug}`** — there is no `PUT`.

Body: the same shape as [author](#author-a-rule). The policy is a **full replacement**, not a
patch, and a successful save increments `policy_version`. The rule keeps its identity and its
slug, so the incidents and timeline already pointing at it stay attached.

A rule website monitoring created answers `Rule is managed by Website monitoring` (code `2003`):
its policy is the check form's, and a save here would be rewritten on the next check save.

### Delete a subject rule

**`DELETE /v2/subjects/{subject_slug}/rules/{rule_slug}`**

```json
{ "message": "Rule deleted successfully", "rule_id": "export-health", "subject_id": "payments-worker" }
```

A rule another rule cites as an input answers `Rule is still used as an input` (code `2003`);
a built-in Reachability rule answers `Rule is managed by Website monitoring` (code `2003`) and
cannot be deleted at all.

## Observations

### Report an observation

**`POST /v2/subjects/{subject_slug}/signals/{signal_slug}/observations`**

Reports one observation to a **custom heartbeat or event** signal of a Custom subject. Both
slugs are shown on the signal's page in the dashboard, and by
[list signals](#list-signals).

| Field | Required | Meaning |
|---|---|---|
| `status` | yes | `ok` or `problem`. |
| `observed_at` | no | RFC 3339, e.g. `2026-09-01T12:00:00Z`. Omit to mean now. |
| `value` | no | A number a rule can compare with `<` or `>`. |
| `error` | no | Your own error text, for a problem worth explaining. |
| `labels` | no | An open string map that rules match on. |

```sh
curl -X POST "$UPTIMER_URL/api/v2/subjects/payments-worker/signals/worker-pulse/observations"   -H "Authorization: Bearer $UPTIMER_TOKEN"   -H "Content-Type: application/json"   -d '{"status":"ok","value":1.5,"labels":{"instance":"worker-3"}}'
```

Returns the stored [observation object](#observation-object-v2).

**A stored observation the engine will not evaluate is returned, not refused.** A timestamp far
in the future comes back with `accepted: false` and `reject_reason: "clock_skew"` — it was
received and kept. An error means nothing was stored.

Refusals, all of which store nothing:

| Answer | When |
|---|---|
| `invalid status` (code `2001`) | `status` missing, or not `ok`/`problem`. |
| `invalid observed_at` (code `2001`) | Not an RFC 3339 timestamp. |
| `invalid label` (code `2001`) | An empty label key, or a key/value over its length limit. |
| `Signal not found` (code `2002`) | No signal with that slug on the subject. |
| `Subject not found` (code `2002`) | No subject with that slug in a workspace you belong to — the same answer a subject you cannot see gives. |
| `Signal does not accept posted observations` (code `2003`) | The signal is **platform HTTP**. Its stream belongs to Uptimer's own probe, so a posted claim is never mixed in with a measurement. |
| `Website subjects are managed elsewhere` (code `2004`) | The subject is a website check. Its readings are its workers'. |

The workspace comes from your token's membership, not the path: a subject slug is unique per
workspace, not globally. If the same slug exists in two of your workspaces the answer is
`Ambiguous subject` (code `2004`), naming them — add `?workspace_id=<uid>` to choose.

Reporting requires the workspace **editor** role; a viewer gets `Access denied` (code `2005`).

Retries are safe: an observation is identified by its signal, `observed_at` and labels, so
re-sending the same one replaces it rather than counting twice.

### List a custom subject's open incidents

**`GET /v2/subjects/{subject}/incidents?workspace_id=<uid>`**

**New in 1.7.0.** The **open** incidents of one Custom subject, with the ids the
[acknowledge](#acknowledge-a-custom-incident) method takes.

| Parameter | Where | Meaning |
|---|---|---|
| `subject` | path | The Custom subject's slug. |
| `workspace_id` | query | Only needed when the same subject slug exists in two of your workspaces. |

```sh
curl "$UPTIMER_URL/api/v2/subjects/payments-worker/incidents" \
  -H "Authorization: Bearer $UPTIMER_TOKEN"
```

```json
{ "result": [
    { "id": "v8dLj9O1tzs", "subject_id": "payments-worker", "rule_id": "queue-depth",
      "rule_name": "Queue depth", "status": "problem",
      "trouble_since": "2026-09-12T10:47:45Z", "confirmed_at": "2026-09-12T10:47:45Z",
      "well_since": null, "acknowledged": false, "acknowledged_at": null,
      "acknowledged_by": "", "kind": "subject_incident" },
    { "id": "xeOkfGadru8", "subject_id": "payments-worker", "rule_id": "export-health",
      "rule_name": "Export health", "status": "problem",
      "trouble_since": "2026-09-12T10:47:45Z", "confirmed_at": "2026-09-12T10:47:45Z",
      "well_since": null, "acknowledged": true, "acknowledged_at": "2026-09-12T11:47:45Z",
      "acknowledged_by": "ops", "kind": "subject_incident" } ],
  "error": null, "meta": null }
```

Returns a list of [subject incident objects](#subject-incident-object-v2), newest
`trouble_since` first; ties fall back to the rule slug, so the order is the same on every call.

**Open incidents only, and all of them.** A subject can have one incident open per rule, and
they are all listed — pending, recovering and no-data included, and acknowledged ones too: that
somebody is already on one is half of what you ask this for. Nothing open answers `[]`. Closed
history is not here; it lives on the subject timeline in the dashboard.

This is a **read**, so the workspace **viewer** role is enough — acknowledging one of them is
not. A website subject answers `Website subjects are managed elsewhere` (code `2004`) like
every other `/v2/subjects` route: its incidents are listed by
[`GET /v2/incidents`](#list-open-incidents).

## Acknowledging an incident

**New in 1.7.0.** Acknowledging says a **person has seen** an open incident. It changes nothing
the engine decided — the verdict, the evidence, the close hold and the alerting all carry on —
and it is recorded once, with who and when, on the incident's timeline. The dashboard does the
same thing from the subject's page; see
[Acknowledging an incident](/v1.7.0/core-concepts/monitors-and-incidents/#acknowledging-an-incident).

Each kind of monitoring acknowledges through **its own API**, like everything else
([the split](#the-api-is-split-by-subject-kind)):

| Monitoring | Method |
|---|---|
| Website | [`POST /v1/rules/{uid}/incidents/{incident}/acknowledge`](#acknowledge-a-website-incident) |
| Custom | [`POST /v2/subjects/{subject}/incidents/{incident}/acknowledge`](#acknowledge-a-custom-incident) |

Both take **no body**: the person recorded is the owner of the API key you called with, and the
time is the time of the call. A body is refused rather than ignored (`This request takes no
body`, code `2001`) — silently filing an acknowledgement under somebody else's name would be
worse than any error.

Both name **one exact incident**. There is no "the current incident": a subject can have
several open at once, and an id that belongs to another monitor, another subject, another
workspace or the other kind of monitoring is simply `Incident not found` (code `2002`) where
you asked for it.

**Where the incident id comes from — one list per kind, as everywhere else.** For a website
monitor, [`GET /v2/incidents`](#list-open-incidents) has returned each open incident's `id`
since 1.5.0, and remains the Website discovery path. For a custom subject,
[`GET /v2/subjects/{subject}/incidents`](#list-a-custom-subjects-open-incidents) does the same
for that subject. Both flows are API-only:

```sh
# Website: find it, then acknowledge it.
INCIDENT_ID=$(curl -s "$UPTIMER_URL/api/v2/incidents?workspace_id=$WORKSPACE_ID" \
  -H "Authorization: Bearer $UPTIMER_TOKEN" | jq -r '.result[0].id')
MONITOR_UID=$(curl -s "$UPTIMER_URL/api/v2/incidents?workspace_id=$WORKSPACE_ID" \
  -H "Authorization: Bearer $UPTIMER_TOKEN" | jq -r '.result[0].monitor_id')
curl -X POST "$UPTIMER_URL/api/v1/rules/$MONITOR_UID/incidents/$INCIDENT_ID/acknowledge" \
  -H "Authorization: Bearer $UPTIMER_TOKEN"

# Custom: the same two steps, under the subject.
INCIDENT_ID=$(curl -s "$UPTIMER_URL/api/v2/subjects/payments-worker/incidents" \
  -H "Authorization: Bearer $UPTIMER_TOKEN" | jq -r '.result[0].id')
curl -X POST "$UPTIMER_URL/api/v2/subjects/payments-worker/incidents/$INCIDENT_ID/acknowledge" \
  -H "Authorization: Bearer $UPTIMER_TOKEN"
```

Pick the incident you mean rather than `.result[0]` when a subject has several open — that is
what `rule_id` and `rule_name` are in the listing for.

Both require the workspace **editor** role: acknowledging writes a claim about a person, so a
viewer gets `Access denied` (code `2005`) — they can still read that an incident was
acknowledged.

### Acknowledge a website incident

**`POST /v1/rules/{uid}/incidents/{incident}/acknowledge`**

| Parameter | Where | Meaning |
|---|---|---|
| `uid` | path | The website monitor's uid — the same `id` [`GET /v1/rules`](#list-rules) returns. |
| `incident` | path | The incident's [opaque id](#incident-object-v2). |

```sh
curl -X POST "$UPTIMER_URL/api/v1/rules/$MONITOR_UID/incidents/$INCIDENT_ID/acknowledge" \
  -H "Authorization: Bearer $UPTIMER_TOKEN"
```

```json
{ "result": {
    "incident_id": "xeOkfGadru8",
    "monitor_id": "<uid>",
    "status": "problem",
    "acknowledged": true,
    "acknowledged_at": "2026-09-12T11:30:57Z",
    "acknowledged_by": "ops",
    "recorded": true,
    "trouble_since": "2026-09-12T10:30:57Z",
    "confirmed_at": "2026-09-12T10:30:57Z",
    "well_since": null,
    "closed_at": null,
    "kind": "incident_acknowledgement" },
  "error": null, "meta": null }
```

Returns the [incident acknowledgement object](#incident-acknowledgement-object).

### Acknowledge a custom incident

**`POST /v2/subjects/{subject}/incidents/{incident}/acknowledge`**

| Parameter | Where | Meaning |
|---|---|---|
| `subject` | path | The Custom subject's slug. |
| `incident` | path | The incident's [opaque id](#incident-object-v2). |
| `workspace_id` | query | Only needed when the same subject slug exists in two of your workspaces. |

```sh
curl -X POST "$UPTIMER_URL/api/v2/subjects/payments-worker/incidents/$INCIDENT_ID/acknowledge" \
  -H "Authorization: Bearer $UPTIMER_TOKEN"
```

```json
{ "result": {
    "incident_id": "v8dLj9O1tzs",
    "subject_id": "payments-worker",
    "rule_id": "export-health",
    "status": "problem",
    "acknowledged": true,
    "acknowledged_at": "2026-09-12T11:30:57Z",
    "acknowledged_by": "ops",
    "recorded": true,
    "trouble_since": "2026-09-12T10:30:57Z",
    "confirmed_at": "2026-09-12T10:30:57Z",
    "well_since": null,
    "closed_at": null,
    "kind": "incident_acknowledgement" },
  "error": null, "meta": null }
```

`rule_id` is the rule the incident belongs to — useful on a subject with several rules, where
acknowledging one incident says nothing about the others.

### Repeats, closed incidents and refusals

**A repeat is safe and keeps the first person.** Acknowledging again succeeds, adds no second
history entry, and answers `recorded: false` with the original `acknowledged_at` and
`acknowledged_by`. A retried request is therefore not a second claim.

**A closed incident cannot be newly acknowledged**: `Incident is closed` (code `2004`). One
that was acknowledged while it was open keeps that acknowledgement after closing, and
acknowledging it again answers `recorded: false` rather than an error — the look did happen.

| Answer | When |
|---|---|
| `Incident not found` (code `2002`) | No such incident under the monitor or subject you named — including one that belongs to another monitor, another subject, another workspace, or the other kind of monitoring. A malformed id answers the same way. |
| `Incident is closed` (code `2004`) | The incident closed before the call arrived and had not been acknowledged. Anything open now is a **different** incident. |
| `This request takes no body` (code `2001`) | Something was sent in the body. |
| `Custom subjects are managed elsewhere` (code `2004`) | The v1 path named a monitor whose subject is maintained by hand — acknowledge it on `/v2/subjects`. |
| `Website subjects are managed elsewhere` (code `2004`) | The v2 path named a website subject — acknowledge it on `/v1/rules`. |
| `Access denied` (code `2005`) | The key's owner is a viewer, or not a member of that workspace. |

## v1 methods (frozen)

These routes, fields and kinds are unchanged from earlier releases and stay supported.
New integrations should use the [v2 methods](#v2-methods) above.

### List workspaces (v1)

**`GET /v1/workspaces`**

No parameters, no body. Identical to
[`GET /v2/workspaces`](#list-workspaces-v2) — same handler, same payload:

```json
[{ "id": "<uid>", "name": "Default", "role": "owner", "kind": "workspace" }]
```

### List rules

**`GET /v1/rules?workspace_id=<uid>`**

| Parameter | Required | Meaning |
|---|---|---|
| `workspace_id` | yes | The workspace to read. Missing → `Missing workspace ID` (code `2004`). |

Returns a list of stored [rule objects](#rule-object-v1-frozen). A workspace id that
does not exist answers `Workspace not found` (code `2002`); one the key's owner is not
a member of answers `Access denied` (code `2005`).

The v2 equivalent is [`GET /v2/monitoring/websites`](#list-website-monitors), which
returns the same rules with `locations` and an `agreement`.

### Create a rule

**`POST /v1/rules`**

Body: a [rule object](#rule-object-v1-frozen) without `id`. `workspace_id` is required.

`regions` takes region **names**, matched as v2 matches location names; an unknown name
answers `invalid regions` / `Unknown region: "nope"` (code `2001`). Omit it and the rule
is created with none, which leaves it at "No Data".

There is no `agreement` field in v1. A rule created here uses the default agreement,
`majority`, and you change it from the dashboard or through
[`POST /v2/monitoring/websites/{id}`](#update-a-website-monitor).

Returns the stored rule, including its new `id`.

### Get a rule

**`GET /v1/rules/{uid}`**

`{uid}` is the rule's `id`. No body. Returns one stored
[rule object](#rule-object-v1-frozen).

A uid that does not exist, or one the key cannot reach, answers `Rule not found` /
`Rule does not exist or access denied` (code `2002`).

### Update a rule

**`POST /v1/rules/{uid}`** — there is no `PUT`.

Body: a [rule object](#rule-object-v1-frozen) without `id` or `workspace_id`. Like v2,
this is a **full replacement**.

> **Omitting `regions` clears them.** An update that does not carry the field leaves the
> rule assigned to no region, and it stops being checked until you assign one again.
> Send the full list you want to keep.

A uid that does not exist answers `Rule not found` / `Rule does not exist` (code
`2002`). Returns the stored rule.

### Delete a rule

**`DELETE /v1/rules/{uid}`**

No body. Requires an **editor or owner** role in the rule's workspace; a viewer gets
`Access denied` (code `2005`).

```json
{ "message": "Rule deleted successfully", "rule_id": "<uid>" }
```

As with [the v2 delete](#delete-a-website-monitor), this removes the rule and the
subject, signal and history that belong to it. Deleting a uid that is already gone
answers `Rule not found` (code `2002`).

### List regions

**`GET /v1/regions`**

No parameters, no body. The v1 name for what v2 calls
[locations](#list-locations) — the same instance-wide list, with the same active-worker
counts, under the v1 `kind`:

```json
[{ "id": "<uid>", "name": "eu-west", "active_workers_count": 0, "kind": "region" }]
```

## Errors

```json
{ "result": null,
  "error": { "code": 2001, "error_type": "validation_error", "message": "…", "details": "…" },
  "meta": null }
```

**Branch on `code`, not on `error_type`.** `code` is stable and specific:

| code | Meaning |
|---|---|
| `1001`–`1007` | Auth: missing, malformed, invalid or expired token. |
| `2001` | Validation error. |
| `2002` | Not found. |
| `2003` | Forbidden. |
| `2004` | Invalid request — a required query parameter is missing. |
| `2005` | Access denied — the key's owner is not a member of that workspace. |
| `2006` | Malformed JSON. |
| `500` | Internal error. |

`error_type` is one of `access_denied`, `validation_error`, `not_found`, `forbidden`,
`internal_error`, but it is **coarser than the code**: only `2001`, `2002`, `2003` and
the `1xxx` auth codes map to their own type — `2004`, `2005`, `2006` and `500` all
report `internal_error`. That is a v1 quirk, and v2 inherits it deliberately rather
than making the two versions disagree about the envelope.

v2 speaks v2's words in errors too: an unknown location name answers
`invalid locations` / `Unknown location: "…"`, never "region".

Prefer a typed client? See the [Python SDK](/v1.7.0/reference/python-sdk/).
