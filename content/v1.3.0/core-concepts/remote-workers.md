---
title: "Remote workers"
weight: 40
lede: "Run your own prober to check from a private network or an extra location."
description: "Add a remote worker: init, register, connect over gRPC."
---

A **worker** is a prober: it pulls rules from the server, runs the checks, and reports results
back over gRPC. Running a worker elsewhere adds a [region](/v1.3.0/core-concepts/regions/) you
control — inside a private network, or a second geography.

## Add a worker

1. **Generate identities** (once each):
   ```sh
   uptimer server init   # writes server.pem + server.uuid
   uptimer worker init   # writes worker.pem + worker.uuid
   ```
2. **Register the worker** in the dashboard (Server → Workers → Add): paste the worker **UUID**
   and **public key** printed by `worker init`. This is a manual admin step — there is no
   self-registration.
3. **Run the worker**, pointed at the server's gRPC address:
   ```yaml
   worker:
     grpc_server: uptimer-grpc.example.com:50051
     grpc_use_tls: true
   ```
   ```sh
   uptimer --cfg worker.yml worker
   ```

The worker signs every gRPC call with its private key; the server validates it against the
registered public key.

## TLS

The gRPC server does not terminate TLS itself — front it with a reverse proxy / load balancer
that does, and set `worker.grpc_use_tls: true`. On a trusted internal network you can leave it
`false`, as the reference compose does.
