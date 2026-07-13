---
title: "Quick start"
weight: 30
lede: "Run Uptimer from its container and open the dashboard in under a minute."
description: "Run Uptimer from the GHCR image and open the dashboard."
---

## 1 · Run the container

The image lives on GitHub Container Registry:

```sh
docker run -p 2517:2517 ghcr.io/myuptime-info/uptimer:latest
```

Tags: `:latest` (newest stable release), `:X.Y.Z` (pinned, e.g. `:1.3.0`),
`:edge` (latest pre-release).

## 2 · Open the dashboard

Visit **http://127.0.0.1:2517**. Create a rule, point it at a URL, and Uptimer
starts checking it.

> **This is dev mode.** The default command is `dev`, which runs every service in one
> process with **fake auth — any visitor is an admin** — and an ephemeral database.
> It's perfect for a first look, wrong for production. When you're ready, see
> [Production deployment](/v1.3.0/operating/production/).

## 3 · Try the API

The dashboard is just a client of the REST API, served on the same port under `/api`.
Check the version without auth:

```sh
curl http://127.0.0.1:2517/api/version
```
```json
{ "result": "1.3.0", "error": null, "meta": null }
```

Every response is HTTP 200 with a `{result, error, meta}` envelope — check `error`, not the
status code. Everything except `/version` needs an API key; see the
[REST API reference](/v1.3.0/reference/rest-api/).

## Next steps

- [Requirements](/v1.3.0/getting-started/requirements/) — sizing and networking.
- [Rules & checks](/v1.3.0/core-concepts/rules-and-checks/) — what you can monitor.
- [Configuration](/v1.3.0/operating/configuration/) — move off dev mode.
