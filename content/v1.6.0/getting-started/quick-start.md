---
title: "Quick start"
weight: 10
lede: "The one-command run, explained — and where to go next."
description: "Run Uptimer in dev mode and talk to its API."
---

Uptimer is a self-hosted uptime & synthetic monitor: it checks your HTTP(S) endpoints on a
schedule and alerts you when they break. The **same engine** runs hosted at
[myuptime.info](https://myuptime.info) — and you can **export** your data as YAML and import it
into your own instance (or the other way round) at any time, so neither choice locks you in.

Below is the one-command run, explained.

## Run it

```sh
docker run -p 2517:2517 {{< image >}}
```

{{< imagenote >}}

- `2517` serves the **web UI and the REST API** (the API lives under `/api`).
- The default command is `dev`: every service in one process, an **in-memory database** that
  resets on restart, and **fake auth — any visitor is an admin**.

Open **http://127.0.0.1:2517**. You land on **Monitoring** — the one list of everything you
watch. Choose **Add website monitoring**, give it a URL, an interval and at least one location,
and Uptimer starts checking it.

Saving it creates a **monitoring subject** with a built-in HTTP **signal** and a **Reachability
rule**. Open the subject for its timeline, the observations each location reported, and why the
rule decided what it did.

## Talk to the API

The dashboard is just a REST client. Every request carries a **Bearer token** — create one in
the dashboard (**User → API Keys**), copy it from the screen that creates it (it is shown once),
and send it in the `Authorization` header:

```sh
curl -H "Authorization: Bearer $UPTIMER_TOKEN" http://127.0.0.1:2517/api/version
```
```json
{ "result": "1.6.0", "error": null, "meta": null }
```

Every response is HTTP `200` with a `{result, error, meta}` envelope — check `error`, not the
status code.

Ask what is wrong right now:

```sh
curl -H "Authorization: Bearer $UPTIMER_TOKEN" \
  "http://127.0.0.1:2517/api/v2/incidents?workspace_id=<uid>"
```

Full details in the [REST API reference](/v1.6.0/reference/rest-api/).

## Next

Dev mode is for trying, not for running. When you're ready:

- [Core concepts](/v1.6.0/core-concepts/monitors-and-incidents/) — what you're actually configuring.
- [Self-hosting](/v1.6.0/getting-started/self-hosting/) — grow this into a real deployment.
