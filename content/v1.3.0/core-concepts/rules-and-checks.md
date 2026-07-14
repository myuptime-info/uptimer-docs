---
title: "Rules & checks"
weight: 10
lede: "A rule is one thing you monitor: an HTTP(S) target, how often to check it, and what counts as healthy."
description: "What a rule is and how checks run."
---

A **rule** describes a check: **what** to request (an HTTP or HTTPS URL, with a method and an
optional body), **how often** (an interval), and the
[expected response](/v1.3.0/core-concepts/assertions/) that decides up vs. down. Uptimer runs
the check on that interval — from the server, or from a
[remote worker](/v1.3.0/core-concepts/remote-workers/) — and records the result.

> Checks are **HTTP/HTTPS only** in this release: no TCP, DNS, ping or keyword types.

Intervals are whole minutes and the scheduler ticks once a minute, so **one minute is the finest
resolution**.

You create rules in the dashboard or over the API — the dashboard is just an API client. For the
exact request/response fields, see the [REST API reference](/v1.3.0/reference/rest-api/).

## Rule status

Every rule shows one of three statuses:

| Status | Meaning |
|---|---|
| **Up** | The last check passed. |
| **Down** | The last check failed — wrong status code, missing body substring, or a connection/TLS error. |
| **No Data** | The rule isn't being checked. Almost always because **no [region](/v1.3.0/core-concepts/regions/) is assigned** (a rule needs at least one), or after several consecutive checks returned nothing. It can persist in the history until a region is assigned. |

Alerts fire only on a change *between* Up and Down — see
[When an alert actually fires](/v1.3.0/alerting/slack-alerts/#when-an-alert-actually-fires).

> Dashboard timestamps use **`YY/MM/DD`** order (e.g. `26/07/14` is 2026-07-14).
