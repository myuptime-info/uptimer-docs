---
title: "Regions"
weight: 30
lede: "Where a check runs from."
description: "What a region is."
---

A **region** is a named location checks run from — for example `local`, or a geography you add
with a [remote worker](/v1.3.0/core-concepts/remote-workers/). Each region is served by one or
more workers.

Manage regions in the dashboard. Assign a rule to specific regions from the dashboard, or over the
[REST API](/v1.3.0/reference/rest-api/) and [Python SDK](/v1.3.0/reference/python-sdk/) with the
rule's `regions` field (region names). The region-management UI is being reworked, so expect it to
change.

> **A rule with no region is never checked — it stays at "No Data" forever.** Assign at least one
> region to every rule you want monitored. This applies to rules created in the UI, over the
> [REST API](/v1.3.0/reference/rest-api/), and via
> [import](/v1.3.0/core-concepts/workspaces/#export--import).
