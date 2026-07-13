---
title: "Regions"
weight: 30
lede: "Where a check runs from. Each region is served by one or more workers."
description: "Regions — named locations checks run from."
---

A **region** is a named location checks run from (for example `local` or `eu-west`). Every
region is backed by one or more [workers](/v1.3.0/core-concepts/remote-workers/); the API reports
how many are currently active.

```sh
curl -H "Authorization: Bearer $UPTIMER_API_KEY" http://localhost:2517/api/v1/regions
```
```json
{ "result": [ { "id": "…", "name": "local", "active_workers_count": 1, "kind": "region" } ],
  "error": null, "meta": null }
```

Regions are created and managed in the dashboard (Server → Regions).

> **Assigning regions to a rule is done in the dashboard, not the REST API yet** — the API
> creates and reads rules but does not currently attach regions to them. The region-management
> UI is also being reworked, so its screens may change between releases.
