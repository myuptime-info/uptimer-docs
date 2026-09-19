---
title: "Destinations"
weight: 10
lede: "The places a workspace can send alerts — Slack or any webhook, as many as you need."
description: "Create, test, enable and default alert destinations."
---

A **destination** is one place alerts can go: a Slack incoming webhook, or any HTTP endpoint that
accepts a POST. A workspace has as many as it needs, and each [subject](/v1.8.0/core-concepts/signals-and-rules/)
decides which of them it tells — see [Alert delivery](/v1.8.0/alerting/alert-delivery/).

Before 1.8.0 a workspace had exactly one webhook URL and every alert in it went there. That field
is gone. **On upgrade the address you had becomes a destination named `Default`**, enabled and
marked as the workspace default, so alerting continues unchanged until you change it.

## Add one

**Workspace → Settings → Destinations**, then **Add Slack webhook destination** or
**Add webhook destination**.

| Field | What it is |
|---|---|
| **Name** | Your label for the row. It is stored here and never sent anywhere — write what tells two similar hooks apart (`Acme Slack · #incidents`). |
| **URL** | The address to POST to. For Slack, the incoming webhook URL. |
| **Channel** | Slack only, and optional. `#incidents` and `incidents` are the same channel — the `#` is dropped before saving. Leave it empty to post wherever the hook is already bound. |
| **Transformation** | The [payload template](/v1.8.0/alerting/transformations/) this destination receives, or **Default** for Uptimer's own message. |
| **Default** | Tick to make this the workspace fallback — what a subject sends to when it has chosen nothing of its own. |

The **type is fixed when you create it.** A Slack hook and a plain webhook carry different
payloads, so there is no edit that turns one into the other: delete and recreate.

## The default, and what it means to have none

At most one destination per workspace is the **default**. A subject that has chosen no
destinations of its own sends there — that is the whole of the rule.

- **The first destination you add becomes the default**, because a workspace whose only
  destination is not the default notifies nobody.
- **A workspace is allowed to have none.** Deleting the default promotes nobody: subjects that
  have chosen nothing then send nothing, which is a state you are entitled to choose. The
  Destinations section says so.
- **A switched-off destination cannot be made the default** — a fallback that cannot receive
  anything is silence wearing a label. A destination that is *already* the default can be
  switched off; the row then reads `Yes · off`, and the workspace's fallback sends nothing until
  you turn it back on.

## Off, on, and delete

Each row's **More** menu carries the rest:

- **Send test** posts one real message through the same render, transport and delivery log a real
  alert uses, and tells you what the far end said. A refusal is the destination's answer, quoted.
- **View delivery** opens that destination's [log](/v1.8.0/alerting/delivery-log/).
- **Disable** / **Enable** stops and resumes sending without losing the row, its address, or any
  subject that points at it.
- **Delete** removes it, and with it every subject selection naming it. Delivery records already
  written stay: they record what was sent, and that remains true after the destination is gone.

## The address is a credential

A webhook URL is enough for anyone holding it to post into your channel. The list shows it
**shortened**, with the whole value on hover or keyboard focus, and the edit form leaves the field
blank with a redacted placeholder — saving without typing a new one keeps the stored address.
Delivery records never store the URL.

Everything in this section requires the **Edit workspace** permission, reading included. The same
is true of the [REST equivalents](/v1.8.0/reference/rest-api/#notifications).
