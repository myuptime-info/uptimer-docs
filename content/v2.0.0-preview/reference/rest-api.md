---
title: "API v3"
weight: 10
lede: "The public API of Uptimer 2.0: Resources, Templates, Observations, Incidents, maintenance and acknowledgement."
---

The public API of Uptimer 2.0: Resources, Templates, Observations, Incidents,
maintenance and acknowledgement. The Python SDK 2.0 (`uptimer-python-sdk`)
wraps every route here. `uptimer mcp` offers it to MCP
clients ([MCP](/v2.0.0-preview/reference/mcp/)).

## Calling it

Base path `/api/v3`. Send a person's API key (User → API keys):

```text
Authorization: Bearer <api key>
```

A **full** key reads and writes what its owner may in each Workspace: every
member reads; creating, changing, sending Observations and maintenance need
editor or owner; any member may acknowledge. An Observation address is not a
key and reads nothing here.

A **scoped** key (User → API keys → Access: Scoped) reaches one Workspace. It
reads everything there and takes only the actions it was given:
`acknowledge`, `maintenance` (start and end), `observe` (send Observations),
`templates` (publish Templates), `resources` (create and archive Resources).
It never edits a Resource, and it reads a Resource's secret Template fields as
`[redacted]`, its URL fields without credentials, and an Observation label whose
name marks a credential (`api_token`, `Authorization`, …) as `[redacted]`; Template
field defaults follow the same rule. Its owner's role still applies on top:
a viewer's scoped key cannot start maintenance. Any other Workspace answers
404. A scoped key is not accepted as the second factor of an Observation
address. `uptimer mcp` uses these keys; see
[MCP](/v2.0.0-preview/reference/mcp/).

Every write, refused or not, and every read of recorded evidence is kept in
`server_api_audit`: time, person, key, Workspace, method, path, status and
User-Agent (`uptimer-mcp/<version>` for MCP calls). Recorded evidence means an
Incident with its history (`GET …/incidents/{id}`), its deliveries
(`…/incidents/{id}/deliveries`) and the Observation log
(`GET …/resources/{r}/observations`). Lists of Workspaces, Templates,
Locations, Resources and Incidents, and a Resource's detail, are not
recorded.

Identifiers are public ids (short strings). A Resource is also addressed by
its `key`.

## Answers and errors

Every answer is one envelope:

```json
{"result": …, "error": null, "meta": null}
{"result": null, "error": {"code": 1422, "error_type": "validation", "message": "…", "details": {"field": "url"}}, "meta": null}
```

| HTTP | `code` | `error_type` | Meaning |
|---|---|---|---|
| 400 | 1400 | `bad_request` | The body is not JSON this route reads (unknown fields are refused). |
| 401 | 1401 | `auth` | No key, or one this installation does not accept. |
| 403 | 1403 | `forbidden` | A member whose role does not allow this write, or a scoped key without the action; then `details.scope` names it (`acknowledge`, `maintenance`, `observe`, `templates`, `resources`, or `full`). |
| 404 | 1404 | `not_found` | No such route, Workspace, Resource or Incident — including one in a Workspace you do not belong to. |
| 409 | 1409 | `conflict` | Not in a state the action applies to (acknowledging a closed or acknowledged Incident). |
| 422 | 1422 | `validation` | A field was refused; `details.field` names it. |
| 500 | 1500 | `server` | This installation failed. |

The 1.x API families (`/api/v1/*`, `/api/v2/workspaces`, …) answer `410` with
code 1410.

Lists that page put the next cursor in `meta.next_cursor` (null on the last
page). Pass it back as `cursor`. `limit` is 1–200, default 50.

## Routes

| Method and path | Result |
|---|---|
| `GET /version` (no key) | `{version, api: "v3"}` |
| `GET /key` | what this key may do: `{user, access, workspace}`; `access` is `["full"]` or `["read", …actions]`, `workspace` is null on a full key |
| `GET /workspaces` | the Workspaces this key reaches: `[{id, name, role}]` |
| `POST /workspaces` | create a Workspace you own: `{"name": "…"}` (1–60 characters, trimmed) → 201 `{id, name, role: "owner"}`; 422 `field: name` for a blank or longer name; 403 `scope: full` for a scoped key. Full key only. From the release candidate after `2.0.0-rc2` |
| `GET /templates` | the system Templates with `fields`, `signals`, `rules` |
| `GET /locations` | `[{id, name}]` |
| `GET /workspaces/{ws}/templates` | the system Templates, then this Workspace's own, every revision (`id` is `key@version`); each Rule carries its `action`, `destination` and `routes` |
| `POST /workspaces/{ws}/templates` | publish a pushed-data Template revision (below) → 201; 409 if this key and version exist; editor or owner, full key |
| `GET /workspaces/{ws}/resources` | page of Resources by id, with `open_incident` and `archived_at`; `state` active (default), archived or all; `template`; `meta.<field>=<value>` (below); `limit` 1–200, `cursor` |
| `POST /workspaces/{ws}/resources` | create from a Template: `{template, key?, name, meta}` → 201, Resource detail. `template` is a key (its newest revision) or `key@version` |
| `GET /workspaces/{ws}/resources/{id or key}` | Resource detail: `signals`, `rules` (each with `status`, `explanation`, `since`, `open_incident`, `action`, `destination`, `routes`), `maintenance` |
| `PATCH /workspaces/{ws}/resources/{id or key}` | `{name?, meta?}`; unsent answers stay; key and Template never change |
| `POST /workspaces/{ws}/resources/{id or key}/archive` | retire it from the inventory → 200, Resource detail with `archived_at`; 409 if already archived; editor or owner, full key |
| `POST /workspaces/{ws}/resources/{id or key}/rebind` | move an active pushed-data Resource to another published pushed-data revision: `{"template": "key" or "key@version", "meta": {…}}` → 200, Resource detail with the same `id` and `key`, the new `template`, Signals and Rules. Its old Rules' open Incidents close as `rule_removed`; earlier Observations and Incidents stay readable; evidence for a Signal the new revision does not declare is refused. 422 (`field`) for an unknown, worker, or same revision or a refused answer, with nothing changed; 409 if archived; editor or owner, full key. From the release candidate after `2.0.0-rc2` |
| `POST /workspaces/{ws}/resources/{r}/observations` | `{signal, state, kind?, value?, labels?, body?, at?, id?, reason?}` → 202 `{resource, signal, observation, created_signal}`; `state` is ok, problem or no_data (no evidence this time; never health); the same `id` twice is stored once. `reason` is a short plain-text why: control characters become spaces, blank is none, past 200 characters it is cut to 199 and "…"; a Rule that uses this reading records it in its evidence (`inputs[].reason`) and alert (from the release candidate after `2.0.0-rc2`) |
| `GET /workspaces/{ws}/resources/{r}/observations?signal&limit` | newest logged Observations — context, not a decision record |
| `PUT /workspaces/{ws}/resources/{r}/maintenance` | `{minutes}`: hold notifications; judging and history go on |
| `DELETE /workspaces/{ws}/resources/{r}/maintenance` | end it |
| `GET /workspaces/{ws}/incidents` | page of Incidents, newest first; filters `resource`, `rule`, `lifecycle` (open, closed), `confirmation` (confirmed, unconfirmed), `acknowledged` (true, false; with `lifecycle=open`, false is what still needs action; from the release candidate after `2.0.0-rc2`), and the Resources' `template`, `resource_state` (all by default, active, archived) and `meta.<field>` |
| `GET /workspaces/{ws}/resources/{r}/incidents` | the same, for one Resource |
| `GET /workspaces/{ws}/incidents/{id}` | Incident with `history`, oldest first |
| `GET /workspaces/{ws}/incidents/{id}/deliveries?limit` | what was sent about it, newest first: `[{at, destination, type, event, status, reason}]`; `status` delivered, failed or held; `reason` a fixed code (below), null when delivered |
| `POST /workspaces/{ws}/incidents/{id}/acknowledge` | take it on; 409 if closed or already taken |
| `GET /workspaces/{ws}/destinations` | `[{id, name, type, channel, enabled, send_on_open, default}]`, by name; never a URL. Full key; after `2.0.0-rc5` |
| `POST /workspaces/{ws}/destinations` | `{name, type: slack or webhook, url, channel?, enabled?, send_on_open?, default?}` → 201 ([below](#destinations)); editor or owner, full key |
| `PATCH /workspaces/{ws}/destinations/{id}` | `{name?, url?, channel?, enabled?, send_on_open?, default?}` → 200; the type never changes; editor or owner, full key |
| `DELETE /workspaces/{ws}/destinations/{id}` | → 200 `{id, deleted: true}`; 422 with `details.used_by` while a live route uses it; editor or owner, full key |
| `POST /workspaces/{ws}/destinations/{id}/test` | send the test message → 200 `{status: delivered or failed, reason}`; editor or owner, full key |
| `GET /workspaces/{ws}/destinations/{id}/deliveries?limit&cursor` | page of what was sent to it, newest first: `[{at, event, status, reason, incident}]` (`incident` null for a test); full key |

A delivery `reason` is one of `unreachable`, `http_NNN` (the status code the
destination answered), `not_sent` (it could not be prepared), `maintenance`,
`no_destination`, `not_routed` (the Rule's `routes` send this transition
nowhere, on purpose; after `2.0.0-rc4`), `destination_disabled` (the Rule's own destination is
switched off), `resource_gone`, `not_opted_in` (an opening routed to a destination that did not ask for it), `confirmed_first` (an opening the Incident's confirmation overtook), `not_announced`. It never quotes the
destination's URL, the body sent, or what the destination answered. The
operator's delivery log in the UI shows the body sent and the status the
destination answered, never its URL or its words.

An Incident: `id`, `resource {id, key, name}`, `rule`
(the Rule identity recorded when it opened), `lifecycle`, `confirmation`,
`condition` (ok, problem, no_data), `verdict`, `explanation`, `closed_reason`
(recovered, rule_removed), `opened_at`, `confirmed_at`, `closed_at`,
`effective_at` (when its latest recorded transition took effect: opened,
confirmed, a verdict change or closed; an acknowledgement does not move it),
`acknowledgement {by, at, via}`, and `action` (what its Rule told a person to
do when it opened, or null). History is
`[{at, kind, condition, verdict, explanation, evidence}]`, kinds `opened`,
`confirmed`, `verdict_changed`, `closed`. It is kept after the Rule is edited or
removed. `evidence` is what that transition recorded from the Rule's inputs
when it was decided (below), or null: an administrative closure records none.

## Destinations

From the release candidate after `2.0.0-rc5`, a script manages the Workspace's destinations
with a full API key; a scoped key gets `403` (`scope: full`). A destination's `url` is
written, never read back: no answer, error, test result or delivery entry carries it, a
payload, or what the far end said. A test or a delivery that did not arrive says why with a
fixed `reason` code (above). `send_on_open` is a webhook's opt-in to opening events (Slack
answers `422`; route openings to Slack with a Rule's `routes`). `channel` is a Slack
destination's channel override. The first destination becomes the default; `"default": true`
moves it, and a switched-off destination cannot be it. A name is unique in its Workspace
(`409`).

A Template Rule names a destination by id, `"<id>"` or `{"id": "<id>"}`, or by name,
`{"name": "oncall"}`, in `destination` and in each route. Publishing resolves a name to the one
destination of the publishing Workspace with that name (the exact name, else the only one that
matches ignoring case) and stores its id, so one manifest publishes in every Workspace that has
an `oncall`. No such destination, or more than one, answers `422`. Reads show the id.

`DELETE` answers `422` while a live route uses the destination: the newest revision of one of
the Workspace's Templates names it, or an active Resource's current Rules do.
`details.used_by` lists them, such as `Template paged@2 Rule host_down; Resource srv-0042 Rule
host_down`. Publish the next revision without it, and rebind or archive those Resources; then
the delete goes through. Older revisions no Resource uses do not hold it.

## Observation labels

An Observation may carry `labels`: string keys and values the sender (or a
worker) attaches, such as `{"region": "eu-west", "probe": "probe-eu-1"}`.
They are not Resource Template fields: fields (`meta`) are a Resource's own
settings, given when it is created or edited, used by Rules as thresholds and
by lists as filters, and sent with a webhook as `incident.resource.fields`.
Labels belong to one reading.

**Matching.** A Rule's input may select readings by labels. A reading matches
only when it carries every declared label with exactly the same value (case
included); labels the Rule does not name are ignored. A reading that does not
match is not that Rule's evidence.

**Which Rules select labels today.** None that a Template in this release
configures:
- Built-in Templates (such as `website-check`) derive Rules that read their
  Signals without a label selector.
- Published (pushed-data) Templates use composite Rules, which name their
  Signals in `decision` and cannot declare `input`. A manifest Rule with
  `"input": {"labels": …}` is refused (400: an unknown key).

Label selection is part of the Rule contract (DDR-0003 INV-RL03) for Rules
that declare it; no API v3 route sets it yet.

**Evidence.** Recorded evidence copies only the labels a Rule selects by (at
most 8, values cut at 200 characters, credential-named ones `[redacted]`).
Because no shipped Rule selects labels, recorded evidence and webhook
payloads carry no Observation labels today. Labels stay context: the
Observation log (`GET …/resources/{r}/observations`, the Resource's log page)
shows them. To carry a sender's explanation into evidence and alerts, use the
Observation `reason` instead.

For example, a pushed problem

```json
{"signal": "probe_a", "state": "problem",
 "labels": {"region": "eu-west", "probe": "probe-eu-1"},
 "reason": "TLS handshake timeout"}
```

is logged with both labels and the reason. The Incident it opens records
`{"signal": "probe_a", "status": "problem", "reason": "TLS handshake timeout", …}`
for that input, without the labels. A built-in Website check's Observations
likewise carry `url` and `method` labels that appear in the log, not in
evidence.

## Webhooks

A plain webhook destination receives the attachments a Slack destination
does, plus an `incident` object (Slack destinations never get it):

```json
"incident": {
  "id": "p5rO8cFSTi1T", "rule": "access_loss", "verdict": "problem",
  "action": "Investigate the access path.", "transition": "confirmed",
  "lifecycle": "open", "confirmation": "confirmed", "at": "2026-10-05T12:11:00Z",
  "resource": {"key": "srv-0042", "name": "srv-0042", "template": "service-triage@1",
               "fields": {"provider": "alpha", "load_threshold": 0.4}, "fields_omitted": 0},
  "evidence": {"inputs": [
      {"signal": "probe_a", "status": "problem", "at": "2026-10-05T12:10:58Z"},
      {"signal": "load_ratio", "status": "ok", "value": 0.12, "at": "2026-10-05T12:10:59Z"},
      {"signal": "service_health", "unresolved": "the sender reported no_data"}],
    "omitted": 0, "truncated": false},
  "evidence_note": "Recorded when this transition was decided: one reading per declared Rule input. It is not every contributing Observation, and not current context."
}
```

- `transition` is `confirmed`, `closed` (a recovery), a reminder's latest
  transition, `opened`, or `acknowledged` (where a Rule routes it, after `2.0.0-rc4`); `lifecycle` and `confirmation` are the Incident's
  state as of it.
- **Opening events (opt-in).** A webhook destination with **Also send when an
  Incident opens** (Settings → Destinations) also receives one event when an
  Incident opens and is not confirmed yet: `transition: "opened"`,
  `lifecycle: "open"`, `confirmation: "unconfirmed"`, the same Incident `id`,
  and the evidence recorded when it opened. It is sent right after the opening
  is stored, while the Incident is still unconfirmed; the confirmed event
  follows as before. Uptimer never starts an opening request once the Incident
  is confirmed or closed: if confirmation comes first (a backlog, a delivery
  pause), only the confirmed event is sent, and an opening confirmed between
  being picked and being sent is logged as held (`confirmed_first`). One per opening: re-evaluation while unconfirmed sends nothing
  more, so `id` plus `transition` identifies it. An Incident confirmed at once
  (`confirm_after: 0`) sends no opening; one that closes before it is confirmed
  sends nothing more (read the Incident). Slack destinations, and webhooks
  that did not opt in, receive what they did before; an opening routed to one
  of those is logged as held (`not_opted_in`), unless a Rule's `routes` send
  openings to that Slack destination (after `2.0.0-rc4`). The event's `kind` field (and
  `{{kind}}` in a transformation) is `opened`. From the release candidate after `2.0.0-rc3`.
- `evidence` is recorded when the transition is decided, one entry per
  declared Rule input, and never changes afterwards: later Observations, Rule
  edits and Rule removal leave it as it was. A reminder repeats the latest
  recorded evidence. It is null when nothing was recorded.
- Each input has the reading the Rule evaluated — `status`, `value` (only if
  one was sent), `at`, and only the `labels` the Rule selects by — or
  `unresolved` saying why there was none: never reported, silent, `no_data`,
  or no value for a value comparison. A counted comparison adds
  `counted {matching, required, within_seconds}`; a baseline comparison adds
  `baseline {days, required, samples, median}` (`median` null with no earlier
  readings).
- Bounds: at most 16 inputs (the rest counted in `omitted`), 8 labels, 200
  characters per text value (cut with `…`). Any cut sets `truncated`.
- Credentials never leave: a selected label whose name marks a credential
  (token, secret, password, key, auth, session, cookie, signature, …) is
  recorded as `"[redacted]"` and listed in that input's `redacted`, so it never
  reads as missing. The watched URL in the attachment text and `{{url}}` keeps
  its host, path and other parameters, but any user info (a username alone can
  be a token) and the values of credential-named query parameters read
  `redacted`. This applies to
  problems, reminders and recoveries alike, and to the API history.
- `resource.fields` are the Template's single-valued fields, except secret
  fields and URLs; lists, secrets, URLs and fields past 16 are counted in
  `fields_omitted`, never sent. Observation bodies, other labels, API keys and
  destination URLs are never in it.
- Transformations can use `{{rule}}`, `{{action}}`, `{{resource}}` (the key)
  and `{{evidence}}` (the evidence in one line).

## Archive and filters

Archiving retires a Resource that left the inventory. It is not a deletion:
the Resource keeps its id, key, Template revision, metadata and history, and
stays readable by id or key. It leaves the active list, its open Incidents
close with `closed_reason` `resource_archived` (never a recovery, never
announced as one), and it takes no more Observations (422 on `resource`, on
API v3 and on the Observation address), edits, maintenance or checks (409).
Its key stays reserved: no new Resource can take it. There is no restore.
A write already holding the Resource when the archive arrives commits first;
anything later is refused, and a worker's report for it is dropped — no
Observation is stored after the archive.

Resource and Incident lists take a bounded filter: `template` (a Template
key, any revision) and up to five `meta.<field>=<value>` equalities on that
Template's single-valued fields (string, enum, url, integer, number,
duration, boolean). The value is read as the field's type, so
`meta.load_threshold=0.40` matches `0.4`. A field filter without
`template`, an unknown field, a list field or a value the field cannot hold is
422. An Incident filter may match at most 5000 Resources. Every list stays
inside the Workspace the key reaches, and pages by a stable cursor.

## Pushed-data Templates

A Workspace editor publishes a Template for evidence its own systems push: no
URL, no Locations, no managed worker. A revision
never changes; publish the next `version` to change it. Resources keep the
revision they were created from.

```json
{"key": "service-triage", "version": 1, "name": "…", "summary": "…",
 "fields":  [{"key": "load_threshold", "label": "…", "type": "number", "default": 0.5, "min": 0}],
 "signals": [{"key": "probe_a", "kind": "heartbeat", "every_seconds": 300}, …],
 "rules":   [{"key": "access_loss", "action": "Investigate the access path.",
              "wait": {"confirm_after": 600, "recover_after": 600},
              "decision": {"all": [
                {"signal": "probe_a", "field": "status", "operator": "eq", "operand": "problem"},
                {"signal": "load_ratio", "field": "value", "operator": "lt",
                 "operand": {"meta": "load_threshold"}}]}}]}
```

- Fields: `string`, `integer`, `number`, `boolean`, `enum` (`options`),
  `duration_seconds`, `string_list`, `integer_list`; `required`, `default`,
  `min`, `max`. No `url` or `location_list`.
- Signals: `kind` heartbeat, periodic or event. `every_seconds` (10–86400) is
  how often the sender pushes; a heartbeat silent for three of those is
  unresolved.
- Rules are composite: `decision` is one node — `all`
  (2+), `any` (2+), `not`, or a comparison on one of this Resource's Signals:
  `status` with `eq`/`neq` and `ok` or `problem`, or `value` with `eq`, `neq`,
  `gt`, `gte`, `lt`, `lte` and a number or `{"meta": field}`. At most 4 deep
  and 16 comparisons. `wait` holds are seconds or `{"meta": field}`. `action`
  (1–200 characters) is written on the Rule's Incidents and alerts.
- From the release candidate after `2.0.0-rc2`, a Rule may add
  `"destination": "<id>"`, the id of one of this Workspace's destinations
  (shown on its page under Settings → Destinations). Its Incidents' problem,
  reminder, no-data and recovery messages then go there only, instead of the
  Resource's own destination or the Workspace default; a Rule without one
  follows those as before. Another Workspace's id, a deleted one, or one that
  is not a destination id answers `422` and stores nothing. If the destination
  is switched off later, the Rule's messages are held (`destination_disabled`
  in its delivery log) and go nowhere else; if it is deleted later, they follow
  the Resource and the Workspace default. Routing never changes what is decided.
- From the release candidate after `2.0.0-rc4`, a Rule may add `routes`
  instead of `destination`: up to 10 destinations of this Workspace, each with
  the transitions it receives.

  ```json
  "routes": [
    {"destination": "<on-call Slack id>", "on": ["opened", "problem", "recovery", "acknowledged"]},
    {"destination": "<ops webhook id>"}
  ]
  ```

  Transitions are `opened`, `problem` (the confirmed problem and its
  reminders), `no_data`, `recovery` and `acknowledged`; a route without `on`
  gets `problem`, `no_data` and `recovery`. Each transition goes to every
  route that selects it and nowhere else: no Resource or Workspace default.
  `"routes": []` sends nothing. A transition no route selects is logged as
  held with `not_routed` (`no_destination` stays for a Workspace with nowhere
  to send). A Slack destination routed `opened` gets the opening before
  confirmation; a webhook still needs **Also send when an Incident opens**.
  `acknowledged` is sent once when somebody takes the Incident on, with its
  `confirmation` as of then. `destination` and `routes` together, a
  destination twice, an unknown transition, `"on": []` or another
  Workspace's id answer `422`. Reads show each route with `on` spelled out,
  `[]` for a route to nowhere, and `null` for a Rule without routes.
- A `value` comparison may add `"min_count": N, "within_seconds": S`
  (N 1–100, S 60–86400). It judges the latest N distinct Observations of that
  Signal from the last S seconds (by time, then by stored identity): true if
  all N are numbers that satisfy it, false if all N are numbers that fail it,
  unknown if they are mixed, fewer than N, or include a missing value or
  `no_data`. Opposing comparisons on the same Signal read the same set, so
  they never both hold: three low then three high readings is the high side;
  interleaved readings are neither. Duplicate submissions and re-evaluation
  add no reading; older readings leave the window. The Rule's
  `confirm_after` and `recover_after` apply after this count.
- From the release candidate after `2.0.0-rc2`, a `value` comparison may
  instead add `"baseline": {"days": D, "min_samples": M}` (D 1–30, M 1–10000).
  Its `operand` is then a share of the usual (above 0, at most 100; a number or
  `{"meta": field}`): the newest reading is compared with `operand × median`,
  where the median is of this Resource's own earlier numeric readings of that
  Signal observed in the last D days and before the newest (by time, then by
  stored identity). The newest reading, later ones, `no_data` and readings
  without a value are left out, the same report sent twice counts once, and at
  most the newest 10,000 are read. Fewer than M readings, a zero median, or a
  newest reading that is `no_data` or has no value is unknown. A late reading
  counts by when it was observed. A baseline comparison reads the newest
  reading and cannot also take `min_count`. The explanation shows it, e.g.
  `load 40 (7d median 100 of 12 readings)`.
- From the release candidate after `2.0.0-rc3`, a composite can ask whether an input has usable data:
  `{"signal": "probe_a", "field": "known"}` (optionally `"within_seconds": S`,
  60–86400) is true for a fresh `ok` or `problem` reading and false for a
  Signal never heard from, gone quiet, older than its window, or reporting
  `no_data`; it is never unknown. `{"all_known": [comparisons…], "min_known": N}`
  and `any_known` judge only the comparisons (2–16, status or value, one Signal
  each) whose Signal is known: unknown while fewer than N are known, else
  `all` / `any` of the known ones. One Template then covers a Resource with
  one probe and one with several: an absent probe does not block the verdict,
  and with no known probe there is no verdict at all.
- Unknown is three-valued: a Signal that never reported, went quiet, said
  `no_data` (whatever value it also carries), or carried no value cannot
  satisfy its own comparison. `not`
  unknown is unknown; `all` is false once anything is false; `any` is true
  once anything is true. An unknown result neither opens, confirms nor closes
  an Incident.
- At most 32 fields, 16 signals, 10 rules. Unknown keys are refused (400);
  an invalid definition is 422 and stores nothing.

## From a key to an Incident

```bash
API=http://127.0.0.1:8080/api/v3
KEY=...   # User → API keys
H="Authorization: Bearer $KEY"

# Which Workspace: the only one this key reaches, or the one UPTIMER_WORKSPACE
# names by id or name. See them: curl -s -H "$H" $API/workspaces | jq -r '.result[] | "\(.id)  \(.name)"'
WS=$(curl -s -H "$H" $API/workspaces | jq -er --arg want "${UPTIMER_WORKSPACE:-}" '
  .result as $all | ($all | map("\(.id) (\(.name))") | join(", ")) as $choices
  | if $want != "" then [$all[] | select(.id == $want or .name == $want)]
      | if length == 1 then .[0].id else error("no single Workspace is called \($want); choose one of: \($choices)") end
    elif ($all | length) == 1 then $all[0].id
    else error("this key reaches \($all | length) Workspaces; set UPTIMER_WORKSPACE to one of: \($choices)") end') || unset WS
LOC=$(curl -s -H "$H" $API/locations | jq -r '.result[0].id')

curl -s -H "$H" -X POST $API/workspaces/$WS/resources -d @- <<EOF | jq '.result | {id, key, signals, rules}'
{"template": "website-check", "key": "checkout-api", "name": "Checkout API",
 "meta": {"url": "https://checkout.example.com/health", "locations": ["$LOC"],
          "interval_value": 5, "interval_unit": "MINUTE",
          "failure_mode": "at_least_one", "confirm_after": 0, "recover_after": 0}}
EOF

SIGNAL=$(curl -s -H "$H" $API/workspaces/$WS/resources/checkout-api | jq -r '.result.signals[0].key')
curl -s -H "$H" -X POST $API/workspaces/$WS/resources/checkout-api/observations \
  -d "{\"signal\": \"$SIGNAL\", \"state\": \"problem\", \"labels\": {\"status\": \"503\"}}"

curl -s -H "$H" $API/workspaces/$WS/resources/checkout-api | jq '.result.rules[0]'
INCIDENT=$(curl -s -H "$H" $API/workspaces/$WS/resources/checkout-api | jq -r '.result.rules[0].open_incident')
curl -s -H "$H" $API/workspaces/$WS/incidents/$INCIDENT | jq '.result | {lifecycle, confirmation, condition, history}'
```

## A fleet from one Template

Create a Resource per host from the same Template, then read every open
Incident:

```bash
for n in $(seq -w 1 50); do
  curl -s -H "$H" -X POST $API/workspaces/$WS/resources -d @- <<EOF >/dev/null
{"template": "website-check", "key": "shop-$n", "name": "shop-$n.example.com",
 "meta": {"url": "https://shop-$n.example.com/health", "locations": ["$LOC"],
          "interval_value": 1, "interval_unit": "MINUTE",
          "failure_mode": "majority", "confirm_after": 120, "recover_after": 120}}
EOF
done
curl -s -H "$H" "$API/workspaces/$WS/incidents?lifecycle=open&limit=200" | jq '.result[] | {resource: .resource.key, explanation}'
```

A sender without a person's key can bring a fleet into being from the
Observation address instead: its first report names the Template
(`template_id` and `meta`) and creates the Resource. See the Observation
address in Settings → Observation endpoints.
