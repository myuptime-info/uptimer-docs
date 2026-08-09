---
title: "Workspaces"
weight: 50
lede: "A workspace owns rules, members and the alert webhook."
description: "Workspaces and roles."
---

A **workspace** groups rules, the people who can access them, and the
[alert webhook](/v1.4.0/alerting/slack-alerts/). Every rule belongs to one workspace.

Members have a role:

- **owner** — manage the workspace and its rules
- **editor** — manage rules
- **viewer** — read-only

A separate account-level **admin** role manages server-wide things: workers, locations and
settings.

## Export & import

Export a workspace to a YAML file from **Workspace → Settings → Export**. It contains every
monitor (target, interval, expected response) and, for each one, the **names** of the locations
it runs in — under the key `regions`, which is the file format's name for them and is not
changing. Import it from **Workspace → Import**.

Import always creates a **new** workspace — it never merges into an existing one — keeping the
name from the file. So importing a `Default` export gives you a second workspace also called
`Default`; rename it afterwards if you like.

**Locations are matched by name** against the ones configured on the target instance:

- Each monitor re-attaches to the locations whose **names match**, so a like-named setup
  round-trips cleanly.
- If a name doesn't exist here, the monitor is topped up from your other locations so it keeps
  the **same number** it had — never more.
- If you have **fewer** locations than a monitor needs, it gets all of them.
- If the instance has **no locations at all**, monitors import with none and sit at **No Data**
  until you add one and assign it — the importer warns you when this happens.

The location *assignments* travel by name, but the locations and workers themselves don't — set
those up on the target instance first for a clean import.
