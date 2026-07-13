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
