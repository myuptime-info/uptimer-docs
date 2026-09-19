---
title: "Uptimer v1.8.0"
lede: "Self-hosted uptime & synthetic monitoring in a single Go binary — up and running in one command."
description: "Uptimer — self-hosted uptime monitoring you can run in one command."
---

Uptimer watches your HTTP(S) endpoints on a schedule, from one or many locations, and alerts you
the moment they break. One Go binary under 100 MB, with a REST API the dashboard itself is built
on — anything you can click, you can script.

## Open source, or hosted — one engine

Run it yourself (these docs) or use the hosted service at
[myuptime.info](https://myuptime.info). **Same engine, same REST API.** Your data stays yours:
export any time and move between self-hosted and cloud — no vendor lock-in.

## Try it in one command

```sh
docker run -p 2517:2517 {{< image >}}
```

{{< imagenote >}}

Open **http://127.0.0.1:2517** and you land on **Monitoring** — add website monitoring, point it
at a URL, watch it go up or down. The REST API is on the same port under `/api`; calls take a
Bearer token you create in the dashboard (**User → API Keys**), shown once when you create it:

```sh
curl -H "Authorization: Bearer $UPTIMER_TOKEN" http://127.0.0.1:2517/api/version
```
```json
{ "result": "1.8.0", "error": null, "meta": null }
```

That's **dev mode**: one process, fake auth, throwaway data — great for a look.
[Quick start](/v1.8.0/getting-started/quick-start/) explains what just happened;
[Self-hosting](/v1.8.0/getting-started/self-hosting/) turns it into a real deployment.

## New in 1.8.0

**Alerts go where each subject says.** A workspace now has as many
[destinations](/v1.8.0/alerting/destinations/) as it needs — Slack or any webhook — and every
subject chooses which of them it tells, and about what, in its own
[Alert delivery](/v1.8.0/alerting/alert-delivery/) table. A
[transformation](/v1.8.0/alerting/transformations/) changes the shape a destination receives, and
the [delivery log](/v1.8.0/alerting/delivery-log/) keeps what was sent, and what the far end
answered, for 30 days. All of it is scriptable under
[`/v2/notifications`](/v1.8.0/reference/rest-api/#notifications).

Upgrading from 1.7.0? The webhook URL you had becomes a destination named `Default`, and alerting
continues unchanged. The [changelog](/v1.8.0/reference/changelog/) has the rest.

## Explore
