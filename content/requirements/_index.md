---
title: "Requirements"
chapter: true
weight: 20
---

# System Requirements

This page outlines the minimum requirements for running **Uptimer** (self-hosted engine behind [MyUptime.Info](https://myuptime.info)).

---

## ✅ Software Requirements

| Component        | Requirement                | Notes                                                                                                                       |
|------------------|-----------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| Docker Engine    | Any modern version (19.03+) | Just needs to support port mapping and volume mounts                                                                        |
| OS               | Any with Docker support     | Linux is recommended for production deployments                                                                             |
| Web Browser      | JavaScript + XHR required   | Should work even for outdated browsers. [Tell us if not](https://github.com/myuptime-info/myuptime-self-hosted-docs/issues) |

---

## ⚙️ Hardware Recommendations

For monitoring ~1,000 checks per minute:

| Role            | CPU     | RAM    | Disk     | Notes                              |
|-----------------|---------|--------|----------|------------------------------------|
| Worker          | 1 core  | 420 MB | -        | Can be scaled horizontally         |
| Server + DB     | 2 cores | 4 GB   | 20+ GB   | Handles UI, storage, notifications |

> For larger workloads, scale by adding more workers or splitting services.

---

## 🌐 Network Access

- **Workers**
  - Require **outbound internet** access to perform checks

- **Server**
  - Must be reachable by workers over **gRPC port**
  - Must expose an **HTTP/HTTPS** port for UI access

---

## ➡️ Next Steps

When your system meets these requirements, proceed to [Configuration](/configuration/) to learn all ways to configure Uptimer.
