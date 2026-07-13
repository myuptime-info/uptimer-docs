---
title: "Requirements"
weight: 30
lede: "What you need to run Uptimer."
description: "Software, hardware and network requirements."
---

## Software

- **Docker 19.03+** (or any OCI runtime). The image is multi-arch — `amd64` and `arm64`.
- **A database** — SQLite needs nothing extra; PostgreSQL is recommended for production.
  See [Choosing a database](/v1.3.0/operating/configuration/#choosing-a-database).

Uptimer is a single **static Go binary** — no runtime, no build step, and you don't need Go
installed. Prefer not to run Docker? Copy the binary straight out of the image and run it:

```sh
docker create --name tmp {{< image >}}
docker cp tmp:/app/uptimer ./uptimer && docker rm tmp
./uptimer dev
```

## Hardware

Uptimer is light. Sizing depends on which role you run:

| Role | CPU | Memory | Notes |
|---|---|---|---|
| Worker (prober) | 1 vCPU | 128–256 MB | Scales with number of checks. |
| Server + SQLite | 1 vCPU | 256–512 MB | Fine for a single-node install. |
| Server + PostgreSQL | 1–2 vCPU | 512 MB+ | Recommended for teams / history. |

## Network

- The **web UI and REST API** share port **`2517`** (the API is served under `/api`).
- [Remote workers](/v1.3.0/core-concepts/remote-workers/) connect to the server over **gRPC** on
  the port set by `grpc.port` (`UPTIMER__GRPC__PORT`) — the reference deployments use **`50051`**.
  It's an internal channel; terminate TLS at your reverse proxy when workers run on other hosts.
- Outbound access from wherever checks run to whatever you monitor.
