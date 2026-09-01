---
title: "Signals & rules"
weight: 15
lede: "A signal is one stream of observations about a subject. A rule decides when those streams add up to an incident."
description: "Custom heartbeat and event signals, and the rules that turn observations into incidents."
---

Saving website monitoring creates a **subject** with two things underneath it: one **signal** —
the stream Uptimer's own workers write their probe results into — and one **rule**,
**Reachability**, which decides when those results mean an incident.

**New in 1.6.0:** you can add your own signals to that subject and write your own rules over
them. A cron job, a queue worker, a nightly export — anything that can make an HTTPS request can
report to Uptimer, and a rule can combine it with the website check.

## Signals

A signal is one stream of observations. Every signal belongs to a subject, and the pair
(subject, signal) is the address a sender posts to.

| Kind | Who writes it | What silence means |
|---|---|---|
| **Platform HTTP** | Uptimer's own workers, from the URL and interval on the website monitoring form | The source is quiet, so the input becomes **no data** |
| **Custom heartbeat** | You, on a schedule | The same — a heartbeat that stops is a problem worth seeing |
| **Custom event** | You, only when something happens | **Nothing** — quiet is normal, and the last reading stands however old |

Choosing between heartbeat and event is choosing what your silence means. A worker that pulses
every 30 seconds is a heartbeat; a deploy notifier or an alert forwarder is an event.

The platform HTTP signal is **created and maintained by website monitoring**. It is marked
built-in: you cannot delete it, and its probe stays on the website monitoring form. It is not a
different kind of thing from your own signals — rules read them all the same way.

### Adding one

**Monitoring → your subject → Signals → Add signal.** Give it a name and pick heartbeat or
event. The name produces the signal's slug, which is the address senders use; renaming the
signal later does not move it.

**Meta** is optional: any JSON object, stored and returned untouched. Uptimer never reads a key
out of it — it is there for your own automation.

A new signal has received nothing, so the Signals page says so and shows the request that sends
its first observation. See [Reporting your own
observations](/v1.6.0/reference/rest-api/#report-an-observation).

### Deleting one

A signal a rule reads cannot be deleted — the page says which rules and links to them. Remove it
from those rules first. Uptimer never unlinks a rule on its own, because that would quietly
change what the rule watches in order to complete an unrelated delete.

## Observations

One observation is one report: a **status** (`ok` or `problem`), an optional numeric **value**,
an optional **error** string, and an open map of **labels** you choose.

Labels are yours. Uptimer stores them and rules match on them; there is no dictionary to
register. One key is reserved: `location`, which is what the platform HTTP signal's workers use
to say where they probed from.

An observation is identified by its signal, its `observed_at` and its labels. Re-sending the
same one **replaces** it rather than counting twice, so a retry after a timeout is safe.

Uptimer keeps every observation it accepts and also the ones it will not evaluate — a report
stamped too far in the future, say. Those come back with `accepted: false` and a
`reject_reason`, and are visible in the signal's log. Storing them is deliberate: "we ignored
this, and here is why" is a different answer from "we never heard you".

### What an observation costs

**Self-hosted Uptimer does not meter or bill observations.** Send as many as your database and
retention are happy with; nothing here counts them.

On the hosted service at [myuptime.info](https://myuptime.info) the unit is **one accepted
observation**, and it is the same unit whatever produced it — a platform HTTP probe, a custom
heartbeat, or a custom event. Observations that are stored but not accepted use no units, and a
retry that replaces a row does not add one. Current allowances and prices are on the
[hosted pricing page](https://myuptime.info/pricing).

## Rules

A rule takes some inputs, decides how many of them must look like a problem, and holds that
answer before it becomes an incident. **Monitoring → your subject → Rules → Add rule.**

### Inputs

An input reads one of the subject's own signals, or another of its rules. Cross-subject inputs
are not possible — a subject is the boundary.

For a **signal** input you choose which observations it selects:

- **Platform HTTP** offers the locations the website form currently watches, including one that
  has not reported yet. Each selected location is a separate input, so "majority of locations"
  counts what you would expect. **Any location** (`location=*`) is one input matching any
  observation that says where it came from; **Any observation** is one input with no filter.
- **Custom signals** take free-text label keys and values. A value of `*` means the key must be
  present with any value. No filters at all selects the whole signal.

For a **rule** input, the cited rule's own verdict is the input: problem is true, ok is false,
and no data is unknown. Prerequisites are evaluated before the rules that read them, so a chain
settles in one pass.

### What counts as a problem

Each custom signal input picks exactly one:

- **Status** — the latest selected observation reports `problem`.
- **Latest value** — the latest selected numeric `value` is `<` or `>` one threshold.
  Observation status is ignored in this mode, and an observation with no number is unknown
  rather than false.

Platform HTTP inputs are always **Status**: the probe reports a status and no number of yours,
so there would be nothing to compare.

### How many must agree

**Any**, **Majority**, **All**, or **At least N**. A rule with no inputs cannot report health,
so it reads as no data.

Unknown inputs do not drag a settled answer down: once enough inputs are true the verdict is
problem, whatever the rest are doing.

### Timing

**Confirm after** is how long a rule must stay bad before the incident is confirmed and anyone
is alerted — the incident opens on the first bad tick regardless. **Close after** is how much
continuous recovery closes it. Both default to two minutes.

**No data after** is per input: how long that input may stay silent before it counts as unknown.
Leave it empty to derive it from the check's interval. Event signals do not offer it — their
silence is not a fault.

### Reachability

The rule website monitoring creates is an ordinary rule with one exception: it cannot be
deleted, because it is part of what the check means. Its **policy is editable** in the same
editor as any other rule, and it keeps its identity when you change it — the incidents and
timeline already pointing at it stay attached.

## Where to go next

- [Report an observation](/v1.6.0/reference/rest-api/#report-an-observation) — the API and a
  runnable curl.
- [Python SDK](/v1.6.0/reference/python-sdk/#reporting-observations) — the same call, typed.
- [Monitors & incidents](/v1.6.0/core-concepts/monitors-and-incidents/) — how a verdict becomes
  an incident, and the badges the dashboard shows.
