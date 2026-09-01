---
title: "Locations"
weight: 30
lede: "Where a check runs from."
description: "What a location is."
---

A **location** is a named place checks run from — for example `local`, or a geography you add
with a [remote worker](/v1.6.0/core-concepts/remote-workers/). Each location is served by one or
more workers, and every result a worker reports is labelled with the location it came from.

Manage locations in the dashboard. Assign a monitor to specific locations from the dashboard, or
over the [REST API](/v1.6.0/reference/rest-api/) and [Python SDK](/v1.6.0/reference/python-sdk/).

> **What each surface calls it.** The dashboard, [API v2](/v1.6.0/reference/rest-api/) and the
> Python SDK all say **locations** — the v2 field is `locations` and it takes location *names*.
> **API v1 still says `regions`**, and is unchanged and supported, so existing clients keep
> working. Workspace [export/import](/v1.6.0/core-concepts/workspaces/#export--import) also keeps
> the file key `regions`. All three mean the same thing.

> **A monitor with no location is never checked — it stays at "No Data" forever.** Assign at
> least one location to every monitor you want watched. This applies to monitors created in the
> UI, over the [REST API](/v1.6.0/reference/rest-api/), and via
> [import](/v1.6.0/core-concepts/workspaces/#export--import).

## Why more than one

A single location tells you whether *it* can reach your site. Several tell you whether the site
is actually down, or whether one vantage point is having a bad day — which is the difference
between a real incident and a false alarm. How many have to agree is a per-monitor choice; see
[How many locations must fail](/v1.6.0/core-concepts/monitors-and-incidents/#how-many-locations-must-fail).
