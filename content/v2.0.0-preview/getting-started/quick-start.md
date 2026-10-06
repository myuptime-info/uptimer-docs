---
title: "Quickstart"
weight: 10
lede: "Run Uptimer 2.0.0-preview and one worker with Docker Compose, then watch a website until it opens an Incident."
---

> Preview build. The image `2.0.0-rc2`, pinned to its multiarch index digest `sha256:1dcea73dc2b9906e3e0f1f0d5a95eb585a4ea1f7e89fc1f2cc43bd7d14773557` (linux/amd64 and linux/arm64), is a 2.0 release candidate for the field test, not a final release.

This guide runs the control plane and one worker on one host. You sign in, add a Location, register the worker, issue its certificate and create a Resource. The worker checks it, and Uptimer opens an Incident when it fails. It takes about ten minutes.

You need Docker with the Compose plugin.

## 1. Start Uptimer

Save this as `compose.yaml`:

```yaml
services:
  uptimer:
    image: {{< image >}}   # preview build
    ports:
      - "8080:8080"   # the UI and the API
      - "9090:9090"   # /metrics, /livez, /readyz
    environment:
      UPTIMER__AUTH__DEV: "true"                       # trial sign-in; use OIDC in production
      UPTIMER__GENERAL__SITE_URL: http://localhost:8080
      UPTIMER__GRPC__HOSTS: uptimer,localhost          # names the worker API's certificate is good for
    volumes:
      - uptimer-data:/data

  worker:
    image: {{< image >}}   # preview build
    command: ["worker"]
    restart: on-failure                                # waits until its certificate exists
    environment:
      UPTIMER__WORKER__GRPC_SERVER: uptimer:50051
      UPTIMER__WORKER__CERT_FILE: /control/workers/edge-1/worker.pem
      UPTIMER__WORKER__KEY_FILE: /control/workers/edge-1/worker-key.pem
      UPTIMER__WORKER__CA_FILE: /control/workers/edge-1/worker-ca.pem
      UPTIMER__OPS__PORT: "9091"
    volumes:
      - uptimer-data:/control:ro                       # one host only: reads the files worker-cert wrote
    depends_on:
      - uptimer

volumes:
  uptimer-data:
```

Start it and wait until it is ready:

```bash
docker compose up -d
curl -s http://localhost:9090/readyz
```

`/readyz` answers `ready` when every service runs. The worker restarts until it has a certificate. That is expected: you issue it in step 3.

## 2. Sign in and add a Location

1. Open `http://localhost:8080/ui/` and choose **Continue as Admin (development)**. Development sign-in is for this trial only; production uses [OIDC](/v2.0.0-preview/operating/sign-in/).
2. Open **Server → Locations → Add a location**, for example `eu-central`. A Location is a place checks run from.

## 3. Register the worker and issue its certificate

1. Open **Server → Workers → Register a worker**. Name it `edge-1`, choose the Location, and enter a new UUID as its **Identity**:
   ```bash
   uuidgen   # or: cat /proc/sys/kernel/random/uuid
   ```
2. Issue its certificate on the control plane:
   ```bash
   docker compose exec uptimer /app/uptimer worker-cert --uid <the UUID> --out /data/workers/edge-1
   ```
   This writes `worker.pem`, `worker-key.pem` and `worker-ca.pem`. The worker container reads them from the shared volume and connects on its next restart:
   ```bash
   docker compose logs worker | tail -2
   # … msg="uptimer worker started" server=uptimer:50051 every=30s kinds=[http]
   ```

## 4. Watch a website

1. Open **Resources → Create Resource → Website**.
2. Enter a name and the URL to check. To see an Incident at once, use a page that answers 404, such as `https://example.com/this-page-does-not-exist`, set **Confirm after** to `0`, and choose your Location.
3. Save. The worker runs the check at once:
   ```bash
   docker compose logs worker | grep 'check ran'
   # … msg="check ran" assignment=… state=problem
   ```
4. Open the Resource. Its Rule reads **problem**, and the Resource links to its open Incident. The Incident page shows why it opened: the Observations, the Rule, the Incident and where it was delivered.

## 5. Check a worker by hand

`worker --once` asks for the assignments, runs what is due, reports and stops. It exits non-zero when the control plane refuses it:

```bash
docker compose run --rm worker worker --once
```

## Next

- [From an API key to an Incident](/v2.0.0-preview/getting-started/first-incident/): the same path with the API and the Python SDK.
- [Run it for real](/v2.0.0-preview/operating/running/): one volume, PostgreSQL, OIDC, a fleet of workers.
- Add a notification: **Settings → Destinations** sends Incidents to Slack or a webhook.
