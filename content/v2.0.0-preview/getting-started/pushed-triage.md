---
title: "Triage pushed service signals"
weight: 30
lede: "Publish a workerless Template, create Resources by your own keys, and turn pushed checks into distinct Incidents."
---

This fictional service example sends checks and load values to Uptimer as
Observations. Uptimer decides between three verdicts for each Resource. No
URL, Location, or managed worker is involved: every input is pushed.

| Rule | When | Action |
|---|---|---|
| `access_loss` | both external probes report problem, the origin check and host health report ok, and the traffic ratio is below the server's threshold | Investigate the access path. |
| `service_down` | the origin check or host health reports problem | Investigate the service. |
| `probe_issue` | at least one external probe reports problem, origin and host health report ok, and the traffic ratio is at or above the threshold | Inspect the probe. |

With every input known, at most one of the three holds. Each is its own Rule with its own
Incidents and history.

You need a running Uptimer 2.0 preview ([Quickstart](/v2.0.0-preview/getting-started/quick-start/)),
`curl` and `jq`, and a full API key from **API keys → New key** (Access: Full) of a
Workspace editor or owner:

```bash
export API=http://localhost:8080/api/v3
export H="Authorization: Bearer <the token>"
# Which Workspace: the only one this key reaches, or the one UPTIMER_WORKSPACE
# names by id or name. See them: curl -s -H "$H" $API/workspaces | jq -r '.result[] | "\(.id)  \(.name)"'
WS=$(curl -s -H "$H" $API/workspaces | jq -er --arg want "${UPTIMER_WORKSPACE:-}" '
  .result as $all | ($all | map("\(.id) (\(.name))") | join(", ")) as $choices
  | if $want != "" then [$all[] | select(.id == $want or .name == $want)]
      | if length == 1 then .[0].id else error("no single Workspace is called \($want); choose one of: \($choices)") end
    elif ($all | length) == 1 then $all[0].id
    else error("this key reaches \($all | length) Workspaces; set UPTIMER_WORKSPACE to one of: \($choices)") end') || unset WS
```

## 1. Publish the Template

Download [`service-triage.json`](https://github.com/myuptime-info/uptimer-docs/blob/main/examples/2.0.0-preview/service-triage.json)
and publish it:

```bash
curl -s -H "$H" -X POST $API/workspaces/$WS/templates -d @service-triage.json | jq '.result.id, .error'
```

```text
"service-triage@1"
null
```

It declares:

- a field `load_threshold` (a number, default `0.5`): below it, traffic counts as gone;
- five pushed Signals: `probe_a`, `probe_b`, `origin`, `service_health` and
  `load_ratio`, each expected every 300 seconds;
- the three Rules above, each with a `decision`, a `wait` and an `action`. `access_loss` waits
  600 seconds before it is confirmed and 600 seconds of health before it closes; `service_down`
  confirms at once and closes after 300 seconds; `probe_issue` confirms and closes at once.

A revision never changes. To change the Template, publish it again with `"version": 2`.
Servers you already created keep revision 1, and so do their Incidents. Publishing the same
key and version twice answers `409`. A definition Uptimer cannot judge answers `422` and stores
nothing. The format is in the [API v3 reference](/v2.0.0-preview/reference/rest-api/#pushed-data-templates).

## 2. Create a server by its own key

Use the key your inventory already has. `meta` is optional here: `load_threshold` defaults to
`0.5`.

```bash
curl -s -H "$H" -X POST $API/workspaces/$WS/resources \
  -d '{"template": "service-triage", "key": "srv-0042", "name": "srv-0042", "meta": {"provider": "alpha", "load_threshold": 0.4}}' \
  | jq '.result | {key, rules: [.rules[] | {key, action}]}'
```

`"template": "service-triage"` takes the newest revision; `"service-triage@1"` pins one. A Resource
that is refused, for example a threshold that is not a number, is not created at all.

## 3. Push what your database knows

Each round, send one Observation per Signal. A status Signal says `ok` or `problem`. The traffic
ratio is your current traffic divided by the server's baseline, as your database computes it,
sent as `value`:

```bash
# push <server> <probe_a> <probe_b> <origin> <service_health> [ratio]
push() {
  send() { curl -s -o /dev/null -H "$H" -X POST "$API/workspaces/$WS/resources/$1/observations" -d "$2"; }
  send "$1" "{\"signal\": \"probe_a\", \"state\": \"$2\"}"
  send "$1" "{\"signal\": \"probe_b\", \"state\": \"$3\"}"
  send "$1" "{\"signal\": \"origin\", \"state\": \"$4\"}"
  send "$1" "{\"signal\": \"service_health\", \"state\": \"$5\"}"
  if [ -n "$6" ]; then
    send "$1" "{\"signal\": \"load_ratio\", \"state\": \"ok\", \"value\": $6}"
  else
    send "$1" '{"signal": "load_ratio", "state": "no_data"}'
  fi
}

push srv-0042 problem problem ok ok 0.1     # both probes fail, the host is fine, traffic is gone
```

Uptimer judges a burst of pushes for one server together, within about half a minute. Then
read the result:

```bash
sleep 35
curl -s -H "$H" $API/workspaces/$WS/resources/srv-0042/incidents \
  | jq '.result[] | {rule, action, lifecycle, confirmation, explanation}'
```

```json
{
  "rule": "access_loss",
  "action": "Investigate the access path.",
  "lifecycle": "open",
  "confirmation": "unconfirmed",
  "explanation": "probe_a problem, probe_b problem, origin ok, service_health ok, load_ratio 0.1"
}
```

It is confirmed once the trouble has held for 600 seconds; keep pushing every round. When the
evidence turns healthy and stays so for 600 seconds, it closes.

### Say why

From the release candidate after `2.0.0-rc2`, an Observation can carry a short `reason`: what
your check saw, in plain text. A Rule that decides on that reading keeps it with the recorded
evidence, and the alert repeats it:

```bash
curl -s -o /dev/null -H "$H" -X POST $API/workspaces/$WS/resources/srv-0042/observations \
  -d '{"signal": "probe_a", "state": "problem", "reason": "TLS handshake timeout from probe-eu-1"}'
```

The Incident's history then shows `"reason": "TLS handshake timeout from probe-eu-1"` on that
input, the Incident page says **Sender said, when this opened: probe_a: …**, and a webhook or Slack
alert adds `Reason: probe_a: TLS handshake timeout from probe-eu-1`. Past 200 characters a reason
is cut to 199 and "…"; line breaks become spaces; a URL in it loses any user name, password and
credential-like query value. A reading sent without a reason simply shows none: the evidence has no
`reason` field and the alert no Reason line. A later Observation never changes a recorded reason.

The other two verdicts:

```bash
for server in srv-0043 srv-0044; do
  curl -s -o /dev/null -H "$H" -X POST $API/workspaces/$WS/resources \
    -d "{\"template\": \"service-triage\", \"key\": \"$server\", \"name\": \"$server\"}"
done
push srv-0043 problem problem problem ok 0.1   # service_down: the origin check fails
push srv-0044 problem ok ok ok 0.9             # probe_issue: traffic is normal
sleep 35
for server in srv-0043 srv-0044; do
  curl -s -H "$H" $API/workspaces/$WS/resources/$server/incidents | jq -c '.result[] | {rule, action}'
done
```

```text
{"rule":"service_down","action":"Investigate the service."}
{"rule":"probe_issue","action":"Inspect the probe."}
```

The alert a destination receives names the server, the verdict and the action, for example
`srv-0042: access_loss — Investigate the access path.`, with the reading above as its error. It is not a
full record of every input value.

## Require several traffic readings

One low traffic reading can be noise. Revision 2 of the Template,
[`service-triage-counted.json`](https://github.com/myuptime-info/uptimer-docs/blob/main/examples/2.0.0-preview/service-triage-counted.json),
adds a count to both traffic comparisons:

```json
{"signal": "load_ratio", "field": "value", "operator": "lt", "operand": {"meta": "load_threshold"},
 "min_count": 3, "within_seconds": 900}
```

Each comparison looks at the latest three distinct traffic Observations from the last 900
seconds. If all three are below the threshold, `access_loss`'s comparison holds; if all three are at
or above it, `probe_issue`'s does. If the three are mixed, fewer than three, or one of them is
`no_data` or has no value, both are unknown, and neither Rule opens or recovers. Both Rules read
the same three readings, so they never hold together: three low readings followed by three high
ones is a probe issue, and alternating readings are neither. The same report sent twice adds
no reading, and a reading older than 900 seconds leaves the set. The waits stay as they were:
`access_loss` is confirmed 600 seconds after the third low reading opened it.

```bash
curl -s -H "$H" -X POST $API/workspaces/$WS/templates -d @service-triage-counted.json | jq '.result.id'
curl -s -o /dev/null -H "$H" -X POST $API/workspaces/$WS/resources \
  -d '{"template": "service-triage@2", "key": "srv-0050", "name": "srv-0050"}'

push srv-0050 problem problem ok ok 0.1
sleep 35
curl -s -H "$H" $API/workspaces/$WS/resources/srv-0050/incidents | jq '.result | length'

push srv-0050 problem problem ok ok 0.1; sleep 2
push srv-0050 problem problem ok ok 0.1
sleep 35
curl -s -H "$H" $API/workspaces/$WS/resources/srv-0050/incidents | jq -c '.result[] | {rule, action, confirmation}'
```

```text
"service-triage@2"
0
{"rule":"access_loss","action":"Investigate the access path.","confirmation":"unconfirmed"}
```

With the Python SDK, `ws.templates.publish(manifest)` publishes a Template and
`ws.resources.observe(...)` pushes; the SDK's `examples/03_field_triage_counted.py` runs the
same gate.

## Flag low_activity servers

A server can pass every check and still carry far less traffic than its peers. Revision 3,
[`service-triage-low_activity.json`](https://github.com/myuptime-info/uptimer-docs/blob/main/examples/2.0.0-preview/service-triage-low_activity.json),
adds a `peer_load_ratio` Signal and a fourth Rule, `low_activity`:

| Rule | When | Action |
|---|---|---|
| `low_activity` | both external probes, origin and host health report ok, and the latest three peer ratios within 1800 seconds are below the server's `peer_load_threshold` (default 0.3), for 1800 seconds | Review service demand when time permits. |

Your system computes the peer ratio: this server's traffic divided by the median traffic of its
peers. Uptimer never sees the peers or the raw traffic. If the peer set is too small or the
median is not valid, push `no_data` for `peer_load_ratio`; a low_activity verdict needs three valid ratios.

`low_activity` never holds together with `access_loss`, `service_down` or `probe_issue`: it needs every check
and the host healthy. It has its own Incident and history, and recovers once the latest three
ratios are at or above the threshold for another 1800 seconds. Keep pushing every round: a gap
longer than the window leaves the count short, which is unknown and pauses recovery.

```bash
curl -s -H "$H" -X POST $API/workspaces/$WS/templates -d @service-triage-low_activity.json | jq '.result.id'
curl -s -o /dev/null -H "$H" -X POST $API/workspaces/$WS/resources \
  -d '{"template": "service-triage@3", "key": "srv-0060", "name": "srv-0060"}'

for round in 1 2 3; do
  push srv-0060 ok ok ok ok 1.0
  curl -s -o /dev/null -H "$H" -X POST $API/workspaces/$WS/resources/srv-0060/observations \
    -d '{"signal": "peer_load_ratio", "state": "ok", "value": 0.2}'
  sleep 2
done
sleep 35
curl -s -H "$H" $API/workspaces/$WS/resources/srv-0060/incidents | jq -c '.result[] | {rule, action, confirmation}'
```

```text
"service-triage@3"
{"rule":"low_activity","action":"Review service demand when time permits.","confirmation":"unconfirmed"}
```

It is confirmed, and announced, once it has held for 1800 seconds. Alerts go to the same
destination as the other verdicts unless a Rule names its own ([below](#send-each-verdict-to-its-own-destination)).

## Compare load with its own past

From the release candidate after `2.0.0-rc2`, Uptimer can compute the "usual" itself: push
the service's raw load, and a Rule compares the newest reading with a share of the median of
that service's own load over the last days. Revision 4,
[`service-triage-history.json`](https://github.com/myuptime-info/uptimer-docs/blob/main/examples/2.0.0-preview/service-triage-history.json),
replaces `load_ratio` with a raw `load` Signal. `access_loss` and `probe_issue` compare it
with `load_share` (default 0.5) of its own 7-day median, once at least 12 earlier readings
exist:

```json
{"signal": "load", "field": "value", "operator": "lt", "operand": {"meta": "load_share"},
 "baseline": {"days": 7, "min_samples": 12}}
```

The median reads only this service's own `load`: earlier numeric readings observed in the
last 7 days, by when they were observed. The newest reading, later ones, `no_data` and
readings without a value are left out, and the same report sent twice counts once. Fewer than
12 readings, a median of 0, or a newest reading that is `no_data` or has no value is unknown,
so it can neither open `access_loss` nor prove a recovery. `days` is 1 to 30 and
`min_samples` 1 to 10000; a baseline comparison cannot also take `min_count`. Peer medians
stay in your system, as for `low_activity`.

```bash
curl -s -H "$H" -X POST $API/workspaces/$WS/templates -d @service-triage-history.json | jq '.result.id'
curl -s -o /dev/null -H "$H" -X POST $API/workspaces/$WS/resources \
  -d '{"template": "service-triage@4", "key": "srv-0070", "name": "srv-0070"}'

# Twelve earlier readings, one every 12 hours: the usual is about 100.
for i in $(seq 1 12); do
  curl -s -o /dev/null -H "$H" -X POST $API/workspaces/$WS/resources/srv-0070/observations \
    -d "{\"signal\": \"load\", \"state\": \"ok\", \"value\": 100, \"at\": \"$(date -u -d "-$((i * 12)) hours" +%FT%TZ)\"}"
done
# Now: both probes fail, origin and service are fine, and load is 40.
for signal in probe_a probe_b; do
  curl -s -o /dev/null -H "$H" -X POST $API/workspaces/$WS/resources/srv-0070/observations \
    -d "{\"signal\": \"$signal\", \"state\": \"problem\"}"
done
for signal in origin service_health; do
  curl -s -o /dev/null -H "$H" -X POST $API/workspaces/$WS/resources/srv-0070/observations \
    -d "{\"signal\": \"$signal\", \"state\": \"ok\"}"
done
curl -s -o /dev/null -H "$H" -X POST $API/workspaces/$WS/resources/srv-0070/observations \
  -d '{"signal": "load", "state": "ok", "value": 40}'
sleep 35
INC=$(curl -s -H "$H" $API/workspaces/$WS/resources/srv-0070/incidents | jq -r '.result[0].id')
curl -s -H "$H" $API/workspaces/$WS/incidents/$INC \
  | jq -c '.result | {rule, explanation}, (.history[0].evidence.inputs[] | select(.signal == "load") | .baseline)'
```

```text
"service-triage@4"
{"rule":"access_loss","explanation":"probe_a problem, probe_b problem, origin ok, service_health ok, load 40 (7d median 100 of 12 readings)"}
{"days":7,"required":12,"samples":12,"median":100}
```

Load of 90 instead would be `probe_issue`: at least half the usual means traffic still
arrives, so the probes are wrong. The waits are unchanged: `access_loss` is confirmed after
600 seconds.

## Send each verdict to its own destination

From the release candidate after `2.0.0-rc2`, a Rule can name the destination its alerts go
to. Page on-call for `access_loss` and `service_down`, and send `probe_issue` and `low_activity` somewhere
quieter. Create both under **Settings → Destinations**; each destination's page shows its
id. Add it to the Rule in your Template, then publish the next revision:

```json
{"key": "access_loss", "action": "Investigate the access path.", "destination": "<on-call destination id>",
 "wait": {"confirm_after": 600, "recover_after": 600}, "decision": {"all": [ … ]}}
```

The confirmed problem, the reminders, a no-data message and the recovery of that Rule's
Incidents all go to its destination and nowhere else. A Rule without a destination follows
the server's own destination, then the Workspace default, as before. Publishing a Rule with
a destination of another Workspace, or one that does not exist, answers `422`. If you switch
the destination off later, that Rule's alerts are held (each Incident's deliveries say
`destination_disabled`); if you delete it, they fall back to the default. Where an alert goes
never changes when an Incident opens, confirms or closes. In `2.0.0-rc2`, every verdict goes
to the default destination.

## Get the alert with its evidence

Add a webhook under **Settings → Destinations** (type Webhook, your endpoint's URL) and make
it the default. When a verdict is confirmed, the webhook body carries an `incident` object:
the Rule (`access_loss`, `service_down` or `probe_issue`), its action, the server's key and fields, and
the evidence that transition recorded — each Signal's status or the traffic ratio it read, or
why it had none:

```json
"evidence": {"inputs": [
  {"signal": "probe_a", "status": "problem", "at": "…"},
  {"signal": "origin", "status": "problem", "at": "…"},
  {"signal": "service_health", "unresolved": "the sender reported no_data"}],
 "omitted": 0, "truncated": false}
```

The evidence is recorded when the transition is decided and does not change when newer
Observations arrive; it is not a list of every Observation. Labels you send, Observation
bodies and secret fields are not included. The full shape is in the
[API v3 reference](/v2.0.0-preview/reference/rest-api/#webhooks). A Slack destination gets the
same alert text without the `incident` object.

## Find servers by field, and retire one

Lists take the Template and its fields as filters. Only `srv-0042` was created with a provider:

```bash
curl -s -H "$H" "$API/workspaces/$WS/resources?template=service-triage&meta.provider=alpha" | jq -r '.result[].key'
```

```text
srv-0042
```

When a server leaves your inventory, archive it. Archiving is not deleting: the server keeps its
key and its history, leaves the active list, stops accepting Observations, and its open Incidents
close as `resource_archived` (not as a recovery). Its key cannot be reused, and there is no
restore. From the release candidate after `2.0.0-rc2` the UI does the same: **Archive** on the
server's row or page ([Quickstart](/v2.0.0-preview/getting-started/quick-start/#6-archive-a-resource-you-no-longer-need)).

```bash
curl -s -H "$H" -X POST $API/workspaces/$WS/resources/srv-0044/archive | jq -r '.result.archived_at != null'
curl -s -H "$H" -X POST $API/workspaces/$WS/resources/srv-0044/observations \
  -d '{"signal": "origin", "state": "ok"}' | jq -r '.error.message'
curl -s -H "$H" "$API/workspaces/$WS/resources?template=service-triage" | jq -r '[.result[].key] | join(" ")'
curl -s -H "$H" "$API/workspaces/$WS/incidents?template=service-triage&resource_state=archived" \
  | jq -c '.result[] | {resource: .resource.key, rule, lifecycle, closed_reason}'
```

```text
true
Resource srv-0044 is archived and accepts no Observations.
srv-0042 srv-0043 srv-0050
{"resource":"srv-0044","rule":"probe_issue","lifecycle":"closed","closed_reason":"resource_archived"}
```

Lists page by `limit` and `next_cursor`; `state=archived` or `state=all` lists archived servers.
With the Python SDK: `ws.resources.list(template="service-triage", meta={"provider": "alpha"})`,
`ws.resources.archive("srv-0044")` and
`ws.incidents.list(template="service-triage", resource_state="archived")`.

## Move a server to a new revision

From the release candidate after `2.0.0-rc2`, a server can follow another published revision
without changing its key: from its page (**Rebind**), or with the API.

```bash
curl -s -H "$H" -X POST $API/workspaces/$WS/resources/srv-0042/rebind \
  -d '{"template": "service-triage@4", "meta": {"provider": "alpha"}}' | jq -c '.result | {key, template}'
```

```text
{"key":"srv-0042","template":"service-triage@4"}
```

The server keeps its id, key and history. Its Signals and Rules become the new revision's. Its
open Incidents of the old revision close as `rule_removed`, not as a recovery, and stay readable
with the Observations they used. Evidence for a Signal the new revision does not declare is
refused. Nothing changes if the revision or an answer is refused, and an archived server cannot
be rebound. Publishing a new revision never moves a server on its own.

## When data is missing

If host health cannot be read, or the traffic ratio has no confidence, send `no_data` for it
(or send the Observation without a `value`). Do not send `ok` to fill a gap.

- A missing, `no_data` or value-less input cannot satisfy its own comparison: it is unknown.
  A `value` sent with `no_data` is ignored.
- Other known inputs still decide. A failing origin check is `service_down` whatever the ratio says;
  one external probe saying ok rules out `access_loss`.
- An unknown result changes nothing: it never opens or confirms access loss, and an open Incident
  does not close while its result is unknown.
- A Signal not pushed for three rounds (900 seconds here) is unknown too, so a script that
  stops cannot leave a server looking healthy.
- A `value` that is not a number is refused (`400`).

## What stays in your database

Peer medians and peer sets stay where they are today: push only the derived peer ratio.
From the release candidate after `2.0.0-rc2`, a service's own usual load can instead be
computed by Uptimer from the raw readings you push ([Compare load with its own past](#compare-load-with-its-own-past)).
Uptimer keeps what it needs to decide: the latest
readings a counted comparison asks for ([Require several traffic readings](#require-several-traffic-readings)),
each server's fields for filtering, and its history after you archive it
([Find servers by field, and retire one](#find-servers-by-field-and-retire-one)).
