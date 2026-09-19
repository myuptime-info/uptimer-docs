---
title: "Delivery log"
weight: 40
lede: "What was actually sent to a destination, and what the far end said."
description: "The 30-day delivery log: payloads, status and filters."
---

Every send Uptimer attempts is recorded: the body it posted, whether it was accepted, and when.
It is the answer to "the alert never arrived" without asking the destination.

Open it from a destination's **More → View delivery** in
**Workspace → Settings → Destinations**, or from the Delivery page's own destination select.

## What a row says

| Column | What it holds |
|---|---|
| **Payload** | the body as it was sent, one line of it in the cell. **View** opens the whole thing. Under it, the alert kind this was. |
| **Status** | **Delivered** or **Undelivered**, and on a failure the reason the far end gave, quoted. |
| **When** | the moment of the attempt, in UTC. |

**View** opens the full payload over the page rather than inside the row, so reading one attempt
does not move the others.

Two filters, both in the URL so a view can be shared or bookmarked:

- the **destination** select — the log is always about one destination;
- **All** / **Undelivered**, side by side. Undelivered narrows the list to attempts that were not
  accepted.

An empty result says so plainly. A workspace with no destinations says that instead — nothing has
been sent because there is nowhere to send it.

## It is a read

Nothing on the page sends, resends or changes a destination. There is no retry button: Uptimer
sends once, in the background, and the record is what happened.

## What it keeps, and for how long

- **Records are kept 30 days**, then removed. The page says so, and the period is fixed — there is
  no setting.
- A record holds the destination's **name and type as they were at the attempt**, so a rename or a
  delete later leaves the row still saying where the message went.
- **The destination's URL is never recorded.** It is a credential; the log is about the message.
- The payload is stored **whole**, exactly as posted — including whatever a
  [transformation](/v1.8.0/alerting/transformations/) made of it.

Reading the log needs the **Edit workspace** permission, like the destinations it belongs to: the
bodies it holds are the messages your monitoring sent.

## Over the API

`GET /v2/notifications/deliveries` returns the same rows with the same two filters — see the
[REST reference](/v1.8.0/reference/rest-api/#the-delivery-log).
