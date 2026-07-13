---
title: "Workspaces"
weight: 50
lede: "A workspace owns rules, members and the notification webhook."
description: "Workspaces and roles."
---

A **workspace** groups rules, the people who can see them, and the
[alert webhook](/v1.3.0/alerting/slack-alerts/). Every rule belongs to exactly one workspace.

## Roles

Members hold a workspace role:

| Role | Can |
|---|---|
| `owner` | View & edit the workspace; view & edit rules. |
| `editor` | View the workspace; view & edit rules. |
| `viewer` | View the workspace and its rules. |

Separately, an **account** role of `admin` (vs. `user`) gates server-wide management — workers,
regions and server settings.

## Listing your workspaces

```sh
curl -H "Authorization: Bearer $UPTIMER_API_KEY" http://localhost:2517/api/v1/workspaces
```
```json
{ "result": [ { "id": "…", "name": "Default", "role": "owner", "kind": "workspace" } ],
  "error": null, "meta": null }
```
