---
title: "Alert delivery"
weight: 20
lede: "Which destinations one subject tells, and about what."
description: "Per-subject alert routing: destinations, alert kinds and the workspace fallback."
---

A workspace-wide webhook says one thing for everything a team watches. **Alert delivery** is the
other half: the marketing site telling nobody must not stop the payments API paging the on-call.

The choice lives on the subject. Open a subject and scroll to **Alert delivery**.

## The table is the form

Pick a [destination](/v1.8.0/alerting/destinations/) from the select, press **Add**, and it
arrives as a row with all three alert kinds ticked — someone adding a destination means "tell this
channel about this thing", and unticking what you do not want is easier than finding the box you
forgot. Untick what this subject should not send there, then **Save**.

| Column | Sends when |
|---|---|
| **Problems & reminders** | a problem is confirmed, and every four hours while nobody has answered it |
| **No data** | the subject settles on no data |
| **Recoveries** | it comes back up |

A reminder rides with **Problems & reminders** — it is a message about time passing rather than a
fourth kind of event, so there is no fourth box.

The select offers only destinations this subject does not already have; once they are all on the
table it is replaced by a line saying so. **Remove** takes a row off, **Clear all** empties the
table, and both are changes you still have to **Save**.

## What an empty table means

Two different things, and the block says which:

- **With a workspace default:** alerts for this subject go there. This is the state every subject
  starts in, and the state an upgraded install is in for all of them.
- **With no default:** nothing is sent for this subject. Not an error — a choice the workspace has
  made by having no fallback.

A subject with rows of its own does **not** also send to the default. The table replaces the
fallback rather than adding to it.

## Disabled destinations

A row pointing at a switched-off destination keeps its place and is marked **Off**. It sends
nothing while it is off, and resumes the moment it is switched back on — no re-adding, no lost
ticks.

## It is delivery, and only delivery

Saving this table changes where alerts go and nothing else. Signals, rules, incidents,
acknowledgement and maintenance are untouched, and no alert is sent or resent by saving.

Changing a subject's delivery needs the same permission as editing that subject. Reading it needs
only workspace access — the table names destinations, never their addresses.

## Over the API

Both kinds of subject carry the table on their own collection: `/v2/subjects/{slug}/delivery` for
Custom, `/v2/monitoring/websites/{id}/delivery` for Website monitors. A `POST` **replaces** the
whole table; `DELETE` clears it. See the
[REST reference](/v1.8.0/reference/rest-api/#a-subjects-alert-delivery).
