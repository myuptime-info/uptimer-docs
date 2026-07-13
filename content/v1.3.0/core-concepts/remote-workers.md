---
title: "Remote workers"
weight: 40
lede: "Run your own prober to check from a private network or an extra location."
description: "What a remote worker is and how it connects."
---

A **worker** is a prober: it pulls rules from the server, runs the checks, and reports results
back over gRPC. Running one elsewhere adds a [region](/v1.3.0/core-concepts/regions/) you
control — inside a private network, or a second geography.

A worker has its own identity (`worker.pem`/`worker.uuid`), connects to the server's **gRPC**
channel, and must be **registered once** in the dashboard (its UUID + public key) before it can
report. It signs every call with its key; the server validates that against the registered
public key.

Setting one up end to end — `init`, register, connect, with a `docker-compose` example and TLS
notes — is covered in [Self-hosting](/v1.3.0/getting-started/self-hosting/) and
[Production deployment](/v1.3.0/operating/production/).
