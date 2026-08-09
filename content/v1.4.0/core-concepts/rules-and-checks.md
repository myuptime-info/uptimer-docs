---
title: "Rules & checks"
weight: 10
lede: "A rule is one thing you monitor: an HTTP(S) target, how often to check it, and what counts as healthy."
description: "What a rule is and how checks run."
---

A **rule** describes a check: **what** to request (an HTTP or HTTPS URL, with a method and an
optional body), **how often** (an interval), and the
[expected response](/v1.4.0/core-concepts/assertions/) that decides up vs. down. Uptimer runs
the check on that interval — from the server, or from a
[remote worker](/v1.4.0/core-concepts/remote-workers/) — and records the result.

> Checks are **HTTP/HTTPS only** in this release: no TCP, DNS, ping or keyword types.

Intervals are whole minutes and the scheduler ticks once a minute, so **one minute is the finest
resolution**.

You create rules in the dashboard or over the API — the dashboard is just an API client. For the
exact request/response fields, see the [REST API reference](/v1.4.0/reference/rest-api/).

## Rule status

Every rule shows one of three statuses:

| Status | Meaning |
|---|---|
| **Up** | Enough regions report the check passing. |
| **Down** | Enough regions report it failing — wrong status code, missing body substring, or a connection/TLS error. |
| **No Data** | Not enough regions have reported to decide. Almost always because **no [region](/v1.4.0/core-concepts/regions/) is assigned** (a rule needs at least one), or because the workers assigned to it have gone quiet. |

Alerts fire only on a change *between* Up and Down — see
[When an alert actually fires](/v1.4.0/alerting/slack-alerts/#when-an-alert-actually-fires).

### How many regions must fail

**New in 1.4.0.** Status is a decision across *all* the regions a rule runs from, not simply the
most recent check to arrive. The rule form has a **Regions Required to Fail** control:

| Setting | The rule goes Down when |
|---|---|
| **Majority of regions** *(default)* | More than half of its regions report a failure. |
| **At least one region** | Any single region reports a failure. |

A majority stops one unhappy region from raising an incident on its own. A region that never
reports is not ignored — it counts as unknown and stays inside the decision, which is why a
half-silent rule reads **No Data** rather than quietly falling back to whichever region did
answer.

With a single region assigned, both settings behave identically.

### Confirming and closing

A rule going bad opens an incident straight away, but nothing is sent for the first **2 minutes**
— the run has to last that long before the incident is *confirmed* and an alert goes out. On the
way back, an ok run has to last **2 minutes** before the incident closes, and the incident is
then backdated to the first ok check.

That is what stops a single blip from paging you, and it is why a short outage can appear in the
history without ever having produced an alert. These waits are fixed in this release.

### Status history

**Changed in 1.4.0.** A rule's history is now a timeline of what happened to it, not a list of
every check that ran. Each row is one event, with the locations that caused it:

| Event | Meaning |
|---|---|
| **pending** | Something started failing. Not confirmed yet, so no alert has been sent. |
| **problem** | Confirmed failing. |
| **no data** | Confirmed, but the regions have gone quiet rather than reported a failure. |
| **recovering** | Reporting ok again, still inside the close wait. |
| **closed** | Back to normal. The row carries how long the incident lasted. |

The **Locations** column shows which regions were failing (red) and which were silent (grey) at
that event, plus the error text they reported. Where an event recorded no evidence of its own,
the last known evidence is carried forward and marked as such.

> Dashboard timestamps use **`YY/MM/DD`** order (e.g. `26/07/14` is 2026-07-14).

## How checks identify themselves

**New in 1.4.0.** Every HTTP(S) check sends a User-Agent that names the product and its version:

```
Uptimer/1.4.0 (+https://uptimer.myuptime.info)
```

Before this, monitoring traffic arrived as `Go-http-client/1.1` — indistinguishable from any
other Go program, and it inflated bot metrics in analytics and error trackers.

- The same value is sent by checks running on the server and on remote workers.
- It carries the product and version only — no workspace, rule, worker or region.
- It is **not configurable**, and a rule cannot set its own headers in this release.

To exclude Uptimer from analytics or logs, filter on the `Uptimer/` prefix — for example
`User-Agent` starting with `Uptimer/`, which survives version bumps.
