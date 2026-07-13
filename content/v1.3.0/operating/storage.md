---
title: "Persistent storage"
weight: 20
lede: "Keep your data, keys and identity across container restarts."
description: "The data directory and how to persist it."
---

Uptimer keeps everything under one **data directory** (`general.data_dir`, default `/data`): the
SQLite database (if used) and the server/worker private keys and UUIDs. Mount a volume there so
it survives restarts.

```sh
docker run -p 2517:2517 \
  -v uptimer-data:/data \
  ghcr.io/myuptime-info/uptimer:latest
```

## What lives in /data

| File | What |
|---|---|
| `server.pem` / `server.uuid` | Server identity — signs API keys and validates workers. |
| `worker.pem` / `worker.uuid` | Worker identity. |
| `server_db.sqlite` | Control-plane database, when using SQLite. |

> Lose `server.pem` and existing API keys stop validating; lose a worker's identity and it must
> be re-registered. Back the volume up — or, for production, use PostgreSQL and keep the keys in
> a secret store.

## Custom config

Mount your own config and point `--cfg` at it:

```sh
docker run -p 2517:2517 \
  -v "$PWD/uptimer.yml:/app/uptimer.yml" \
  ghcr.io/myuptime-info/uptimer:latest --cfg /app/uptimer.yml server
```
