---
title: "Triage pushed fleet signals"
weight: 30
lede: "Publish a workerless Template, create servers by your own keys, push what your database knows, and get banned, dead or checker_issue — each with what to do."
---

Your own systems already know each server's checks and traffic. This guide hands that
evidence to Uptimer as Observations and lets it decide, per server, between three
verdicts. No URL, Location, worker or probe is involved: everything is pushed.

| Rule | When | Action |
|---|---|---|
| `banned` | both regional checks report problem, the control check and host health report ok, and the traffic ratio is below the server's threshold | Replace the server. |
| `dead` | the control check or host health reports problem | Open a provider ticket. |
| `checker_issue` | at least one regional check reports problem, control and host health report ok, and the traffic ratio is at or above the threshold | Inspect the checker; do not replace the server. |

With every input known, at most one of the three holds. Each is its own Rule with its own
Incidents and history.

You need a running Uptimer 2.0 preview ([Quickstart](/v2.0.0-preview/getting-started/quick-start/)),
`curl` and `jq`, and a full API key from **API keys → New key** (Access: Full) of a
Workspace editor or owner:

```bash
export API=http://localhost:8080/api/v3
export H="Authorization: Bearer <the token>"
WS=$(curl -s -H "$H" $API/workspaces | jq -r '.result[0].id')
```

## 1. Publish the Template

Download [`fleet-triage.json`](https://github.com/myuptime-info/uptimer-docs/blob/main/examples/2.0.0-preview/fleet-triage.json)
and publish it:

```bash
curl -s -H "$H" -X POST $API/workspaces/$WS/templates -d @fleet-triage.json | jq '.result.id, .error'
```

```text
"fleet-triage@1"
null
```

It declares:

- a field `ratio_threshold` (a number, default `0.5`): below it, traffic counts as gone;
- five pushed Signals: `region_a`, `region_b`, `control`, `host_health` and
  `traffic_ratio`, each expected every 300 seconds;
- the three Rules above, each with a `decision`, a `wait` and an `action`. `banned` waits
  600 seconds before it is confirmed and 600 seconds of health before it closes; `dead`
  confirms at once and closes after 300 seconds; `checker_issue` confirms and closes at once.

A revision never changes. To change the Template, publish it again with `"version": 2`.
Servers you already created keep revision 1, and so do their Incidents. Publishing the same
key and version twice answers `409`. A definition Uptimer cannot judge answers `422` and stores
nothing. The format is in the [API v3 reference](/v2.0.0-preview/reference/rest-api/#pushed-data-templates).

## 2. Create a server by its own key

Use the key your inventory already has. `meta` is optional here: `ratio_threshold` defaults to
`0.5`.

```bash
curl -s -H "$H" -X POST $API/workspaces/$WS/resources \
  -d '{"template": "fleet-triage", "key": "srv-0042", "name": "srv-0042", "meta": {"provider": "hetzner", "ratio_threshold": 0.4}}' \
  | jq '.result | {key, rules: [.rules[] | {key, action}]}'
```

`"template": "fleet-triage"` takes the newest revision; `"fleet-triage@1"` pins one. A Resource
that is refused, for example a threshold that is not a number, is not created at all.

## 3. Push what your database knows

Each round, send one Observation per Signal. A status Signal says `ok` or `problem`. The traffic
ratio is your current traffic divided by the server's baseline, as your database computes it,
sent as `value`:

```bash
# push <server> <region_a> <region_b> <control> <host_health> [ratio]
push() {
  send() { curl -s -o /dev/null -H "$H" -X POST "$API/workspaces/$WS/resources/$1/observations" -d "$2"; }
  send "$1" "{\"signal\": \"region_a\", \"state\": \"$2\"}"
  send "$1" "{\"signal\": \"region_b\", \"state\": \"$3\"}"
  send "$1" "{\"signal\": \"control\", \"state\": \"$4\"}"
  send "$1" "{\"signal\": \"host_health\", \"state\": \"$5\"}"
  if [ -n "$6" ]; then
    send "$1" "{\"signal\": \"traffic_ratio\", \"state\": \"ok\", \"value\": $6}"
  else
    send "$1" '{"signal": "traffic_ratio", "state": "no_data"}'
  fi
}

push srv-0042 problem problem ok ok 0.1     # both regions fail, the host is fine, traffic is gone
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
  "rule": "banned",
  "action": "Replace the server.",
  "lifecycle": "open",
  "confirmation": "unconfirmed",
  "explanation": "region_a problem, region_b problem, control ok, host_health ok, traffic_ratio 0.1"
}
```

It is confirmed once the trouble has held for 600 seconds; keep pushing every round. When the
evidence turns healthy and stays so for 600 seconds, it closes.

The other two verdicts:

```bash
for server in srv-0043 srv-0044; do
  curl -s -o /dev/null -H "$H" -X POST $API/workspaces/$WS/resources \
    -d "{\"template\": \"fleet-triage\", \"key\": \"$server\", \"name\": \"$server\"}"
done
push srv-0043 problem problem problem ok 0.1   # dead: the control check fails
push srv-0044 problem ok ok ok 0.9             # checker_issue: traffic is normal
sleep 35
for server in srv-0043 srv-0044; do
  curl -s -H "$H" $API/workspaces/$WS/resources/$server/incidents | jq -c '.result[] | {rule, action}'
done
```

```text
{"rule":"dead","action":"Open a provider ticket."}
{"rule":"checker_issue","action":"Inspect the checker; do not replace the server."}
```

The alert a destination receives names the server, the verdict and the action, for example
`srv-0042: banned — Replace the server.`, with the reading above as its error. It is not a
full record of every input value.

## When data is missing

If host health cannot be read, or the traffic ratio has no confidence, send `no_data` for it
(or send the Observation without a `value`). Do not send `ok` to fill a gap.

- A missing, `no_data` or value-less input cannot satisfy its own comparison: it is unknown.
  A `value` sent with `no_data` is ignored.
- Other known inputs still decide. A failing control check is `dead` whatever the ratio says;
  one regional check saying ok rules out `banned`.
- An unknown result changes nothing: it never opens or confirms a ban, and an open Incident
  does not close while its result is unknown.
- A Signal not pushed for three rounds (900 seconds here) is unknown too, so a script that
  stops cannot leave a server looking healthy.
- A `value` that is not a number is refused (`400`).

## What stays in your database

Rolling and peer medians, minimum sample counts and raw traffic history stay where they are
today. Push only the derived ratio and the statuses. Removing servers and filtering them by
metadata are not part of this preview yet.
