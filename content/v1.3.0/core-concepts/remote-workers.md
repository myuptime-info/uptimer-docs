---
title: "Remote workers"
weight: 40
lede: "Run your own prober to check from a private network or an extra location."
description: "Add a remote worker: init, register, connect over gRPC."
---

A **worker** is a prober: it pulls rules from the server, runs the checks, and reports results
back over gRPC. Running one elsewhere adds a [region](/v1.3.0/core-concepts/regions/) you
control — inside a private network, or a second geography. Each worker has its own identity and
must be **registered once** in the dashboard before it can connect.

## Add a worker

**1. Generate the worker's identity.** This writes `worker.pem` + `worker.uuid` to the data dir
and prints what you'll register:

```sh
docker run -v uptimer-data:/data {{< image >}} worker init
```
```text
Private key generated and saved: /data/worker.pem
UUID generated and saved: /data/worker.uuid
Worker UUID: 7f3c1e90-4a2b-4c11-9f5e-2b8d6a0c1234
Public Key:
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA…
-----END PUBLIC KEY-----
```

**2. Register it** in the dashboard — **Server → Workers → Add** — mapping the output to the
form:

| From the init output | Dashboard field |
|---|---|
| `Worker UUID: …` | **UID** |
| the whole `Public Key` PEM block | **Public Key** |
| *(your choice)* | **Name** |

**3. Run the worker**, pointed at the server's gRPC address:

```yaml
worker:
  grpc_server: uptimer-grpc.example.com:50051
  grpc_use_tls: true
```

The worker signs every gRPC call with its private key; the server validates it against the
registered public key. A complete, runnable server + workers stack is in
[`examples/1.3.0/remote-workers`](https://github.com/myuptime-info/uptimer-docs/tree/main/examples/1.3.0/remote-workers);
the production topology is on the [Production deployment](/v1.3.0/operating/production/) page.

## TLS

The gRPC server doesn't terminate TLS itself — put it behind a reverse proxy / load balancer that
does, and set `worker.grpc_use_tls: true`. Leave it `false` only on a trusted internal network.
