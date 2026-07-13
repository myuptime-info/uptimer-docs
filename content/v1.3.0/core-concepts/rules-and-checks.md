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
