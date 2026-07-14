---
title: "Workspaces"
weight: 50
lede: "A workspace owns rules, members and the alert webhook."
description: "Workspaces and roles."
---

A **workspace** groups rules, the people who can access them, and the
[alert webhook](/v1.3.0/alerting/slack-alerts/). Every rule belongs to one workspace.

Members have a role:

- **owner** — manage the workspace and its rules
- **editor** — manage rules
- **viewer** — read-only

A separate account-level **admin** role manages server-wide things: workers, regions and
settings.

## Export & import

Export a workspace to a YAML file from **Workspace → Settings → Export**. It contains every rule
(target, interval, expected response) and, for each rule, the **names** of the regions it runs
in. Import it from **Workspace → Import**.

Import always creates a **new** workspace — it never merges into an existing one — keeping the
name from the file. So importing a `Default` export gives you a second workspace also called
`Default`; rename it afterwards if you like.

**Regions are matched by name** against the regions configured on the target instance:

- Each rule re-attaches to the regions whose **names match**, so a like-named setup round-trips
  cleanly.
- If a name doesn't exist here, the rule is topped up from your other regions so it keeps the
  **same number** of regions it had — never more.
- If you have **fewer** regions than a rule needs, it gets all of them.
- If the instance has **no regions at all**, rules import **region-less** and sit at **No Data**
  until you add a region and assign it — the importer warns you when this happens.

The region *assignments* travel by name, but the regions and workers themselves don't — set
those up on the target instance first for a clean import.
