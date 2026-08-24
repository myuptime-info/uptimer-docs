---
title: "Monitors & incidents"
weight: 10
lede: "A monitor is one thing you watch. When enough locations agree it is broken, Uptimer opens an incident."
description: "What a monitor is, and how Uptimer decides something is wrong."
---

A **monitor** describes what to watch: **what** to request (an HTTP or HTTPS URL, with a method
and an optional body), **how often** (an interval), and the
[expected response](/v1.5.0/core-concepts/assertions/) that decides healthy from broken. Uptimer
checks it on that interval from every [location](/v1.5.0/core-concepts/locations/) you assign —
the server, or a [remote worker](/v1.5.0/core-concepts/remote-workers/) — and each check is one
report from one location.

When enough of those reports say the same thing, Uptimer opens an **incident**: the period the
monitor was not healthy, what the locations saw, and how it ended. That is what the status badge
and the history are showing you.

> Checks are **HTTP/HTTPS only** in this release: no TCP, DNS, ping or keyword types.

> **What it is called where.** The dashboard calls this **website monitoring**, and the thing it
> produces a **monitoring subject**. [API v2](/v1.5.0/reference/rest-api/) and the Python SDK
> agree: `website_monitor`. API v1 and import/export still say `rule` — v1 is frozen and
> supported, so existing clients keep working.
>
> "Rule" now means something narrower: the **incident rule** (Reachability) that decides when a
> subject is in trouble. Saving website monitoring creates the subject, its built-in HTTP
> **signal** and that rule for you.

Intervals are whole minutes and the scheduler ticks once a minute, so **one minute is the finest
resolution**.

You create monitors in the dashboard or over the API — the dashboard is just an API client. For
the exact request/response fields, see the [REST API reference](/v1.5.0/reference/rest-api/).

## Monitor status

A monitor settles into one of three outcomes:

| Status | Meaning |
|---|---|
| **Up** | Enough locations report the check passing. |
| **Down** | Enough locations report it failing — wrong status code, missing body substring, or a connection/TLS error. |
| **No Data** | Not enough locations have reported to decide. Usually because **no [location](/v1.5.0/core-concepts/locations/) is assigned**, or because the workers serving them have gone quiet. |

While a monitor is inside one of the 2-minute holds, the list shows the hold instead:

| Badge | Meaning |
|---|---|
| **Pending** | Failing, but not for 2 minutes yet — no alert has been sent. |
| **Recovering** | Passing again, but not for 2 minutes yet — the incident is still open. |

So the list can show five badges in total. See
[When an alert actually fires](/v1.5.0/alerting/slack-alerts/#when-an-alert-actually-fires).

### How many locations must fail

Status is a decision across *all* the locations a monitor runs from, not simply the most recent
check to arrive. The website monitoring form has a **Locations Required to Fail** control, and
**1.5.0 adds a third setting**:

| Setting | API v2 `agreement` | The monitor goes Down when |
|---|---|---|
| **Majority of locations** *(default)* | `majority` | More than half of its locations report a failure. |
| **At least one location** | `any` | Any single location reports a failure. |
| **All locations** *(new in 1.5.0)* | `all` | Every one of its locations reports a failure. |

A majority stops one unhappy location from raising an incident on its own; *all locations* is the
other end — useful when a single vantage point failing is expected noise. A location that never
reports is not ignored: it counts as **unknown** and stays inside the decision, which is why a
half-silent monitor reads **No Data** rather than quietly falling back to whichever location did
answer.

With a single location assigned, all three settings behave identically.

**New in 1.5.0: the [REST API](/v1.5.0/reference/rest-api/) can set it too.** API v2 carries the
same choice as the `agreement` field on a website monitor, so a monitor created headlessly gets
the agreement you asked for instead of the default. Omitting `agreement` on an update keeps the
stored value. API v1 has no such field — a monitor created through v1 uses **Majority of
locations** until you change it.

Each location you select becomes **one input on the rule**. The rule page lists them, what each is
currently reporting, and the agreement in force.

### Confirming and closing

A monitor going bad opens an incident straight away, but nothing is sent for the first **2 minutes**
— the run has to last that long before the incident is *confirmed* and an alert goes out. On the
way back, an ok run has to last **2 minutes** before the incident closes, and the incident is
then backdated to the first ok check.

That is what stops a single blip from paging you, and it is why a short outage can appear in the
history without ever having produced an alert. These waits are fixed in this release.

### Where you see what happened

**Changed in 1.5.0.** **Monitoring** is the workspace home and the only list. Each row is a
monitoring subject with the state of its rules, filtered by **All** or **With incidents**, and
links into that subject. The old checks list and the per-rule history page are gone; `/checks`
redirects to Monitoring, so existing links still land.

Three screens answer three different questions:

| Screen | What it shows |
|---|---|
| **Timeline** | What happened to a subject, newest first. A closing event carries how long the incident lasted. |
| **Observation log** | Every report each location sent for a signal, with a day picker and paging. |
| **Rule page** | One input per selected location, what each is reporting now, the agreement in force, and the confirm/close holds. |

A timeline row is one event, with the locations that caused it:

| Event | Meaning |
|---|---|
| **pending** | Something started failing. Not confirmed yet, so no alert has been sent. |
| **problem** | Confirmed failing. |
| **no data** | Confirmed, but the locations have gone quiet rather than reported a failure. |
| **recovering** | Reporting ok again, still inside the close wait. |
| **closed** | Back to normal. The row carries how long the incident lasted. |

The **Locations** column shows which were failing (red) and which were silent (grey) at that
event, plus the error text they reported. Where an event recorded no evidence of its own,
the last known evidence is carried forward and marked as such.

The observation log is the one to open when the screens disagree with reality. Its **Unaccepted**
filter shows reports that were stored but not used for a verdict, and says why — which is what
answers *"the workers are running, so why does the rule say no data?"*.

> **Not yet replaced on Monitoring:** the uptime history strip and sorting by name, status or
> up-since went with the old checks list. Monitoring has the All / With incidents filter only.

> Monitoring URLs use **opaque ids** rather than database numbers. They are derived from
> [`server.sqids_salt`](/v1.5.0/operating/configuration/) — change that value and existing
> Monitoring links (and API incident ids) stop resolving.

> Dashboard timestamps use **`YY/MM/DD`** order (e.g. `26/07/14` is 2026-07-14).

## How checks identify themselves

**New in 1.4.0.** Every HTTP(S) check sends a User-Agent that names the product and its version:

```
Uptimer/1.5.0 (+https://uptimer.myuptime.info)
```

The version is the build's own, so a pre-release image sends what it actually is — for example
`Uptimer/1.5.0-rc13 (+https://uptimer.myuptime.info)` on an `:edge` build.

Before this, monitoring traffic arrived as `Go-http-client/1.1` — indistinguishable from any
other Go program, and it inflated bot metrics in analytics and error trackers.

- The same value is sent by checks running on the server and on remote workers.
- It carries the product and version only — no workspace, monitor, worker or location.
- It is **not configurable**, and a rule cannot set its own headers in this release.

To exclude Uptimer from analytics or logs, filter on the `Uptimer/` prefix — for example
`User-Agent` starting with `Uptimer/`, which survives version bumps.
