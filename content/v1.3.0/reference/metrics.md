---
title: "Metrics"
weight: 30
lede: "Prometheus metrics on /metrics when you pass --metrics."
description: "The /metrics endpoint and exported series."
---

Add `--metrics` to any command (`server`, `grpc`, `worker`, `dev`) to expose a Prometheus
endpoint at **`/metrics`** on `general.metrics_port`:

```sh
UPTIMER__GENERAL__METRICS_PORT=9100 uptimer server --metrics
curl http://localhost:9100/metrics
```

## Series

| Metric | Type | Labels |
|---|---|---|
| `http_request_duration_seconds` | summary | `route`, `method`, `status` |
| `grpc_request_duration_seconds` | summary | `grpc_method`, `grpc_code` |

`grpc_request_duration_seconds` is new in 1.3.0. Uptimer intentionally **unregisters the default
Go/process collectors**, so `go_*` / `process_*` series are absent and the endpoint stays small.

## Scrape config

```yaml
scrape_configs:
  - job_name: uptimer
    static_configs:
      - targets: ["uptimer:9100"]
```
