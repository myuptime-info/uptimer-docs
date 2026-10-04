---
title: "Workers and certificates"
weight: 40
lede: "Register a worker, issue its certificate, run it, check it with --once, rotate and revoke it, and replace 1.x workers."
---

A worker runs the checks for one Location and reports what it saw. In 2.0 a worker proves who it is with a client certificate issued by your installation (mutual TLS on the worker API, port 50051). Its requests carry no key and no ID: the certificate is its identity.

## Register and issue

1. In the UI, open **Server → Workers → Register a worker**. Give it a name, a Location, and a new UUID as its **Identity** (`uuidgen`).
2. On the control plane, issue its certificate:

   ```bash
   uptimer worker-cert --uid <the UUID> --out ./edge-1
   ```

   ```text
   Issued a certificate for edge-1 (<the UUID>), good until <one year from now>.
   ```

   The command writes three files. The first run also creates the installation's worker authority in `UPTIMER__GRPC__CA_DIR` (default `<data>/worker-ca`); keep it on a volume and back it up.

| File | What it is | Keep it |
|---|---|---|
| `worker.pem` | the worker's certificate | public |
| `worker-key.pem` | the worker's private key | secret: only on the worker host |
| `worker-ca.pem` | the authority that signed the control plane, so the worker knows it is talking to your installation | public |

The private key is written to disk and never printed. `--show` prints the certificate.

In the container image the binary is `/app/uptimer`:

```bash
docker compose exec uptimer /app/uptimer worker-cert --uid <the UUID> --out /data/workers/edge-1
```

## Run the worker

Copy the three files to the worker host and start it:

```bash
UPTIMER__WORKER__GRPC_SERVER=uptimer.example.com:50051 \
UPTIMER__WORKER__CERT_FILE=/etc/uptimer/worker.pem \
UPTIMER__WORKER__KEY_FILE=/etc/uptimer/worker-key.pem \
UPTIMER__WORKER__CA_FILE=/etc/uptimer/worker-ca.pem \
UPTIMER__OPS__PORT=9091 \
uptimer worker
```

| Setting | Flag | Meaning |
|---|---|---|
| `UPTIMER__WORKER__GRPC_SERVER` | `--server` | the control plane's worker API, `host:port` |
| `UPTIMER__WORKER__CERT_FILE` | `--cert` | `worker.pem` |
| `UPTIMER__WORKER__KEY_FILE` | `--key` | `worker-key.pem` |
| `UPTIMER__WORKER__CA_FILE` | `--ca` | `worker-ca.pem` |
| `UPTIMER__WORKER__EVERY` | `--every` | seconds between asking for its assignments; default 30 |
| `UPTIMER__OPS__PORT` | `--ops-port` | `/metrics`, `/livez`, `/readyz`; required for the daemon |

The host name in `UPTIMER__WORKER__GRPC_SERVER` must be one the control plane's certificate covers. Set them on the control plane with `UPTIMER__GRPC__HOSTS` (default `localhost,127.0.0.1,::1`), for example `UPTIMER__GRPC__HOSTS=uptimer.example.com`.

A worker started without its files stops with a message that says which file is missing and how to issue it.

## Check a worker by hand

`--once` asks for the assignments, runs what is due, reports and stops. It serves no operations port.

```bash
uptimer worker --once   # with the same settings as above
```

```text
… msg="uptimer worker running one cycle" server=uptimer.example.com:50051 kinds=[http]
… msg="check ran" assignment=… state=ok
```

It exits `0` when the report was accepted, and non-zero when the control plane refused it or did not take the report.

## Rotate

Issue again for the same UUID. The new certificate replaces the old one, and the old one stops being accepted at once:

```bash
uptimer worker-cert --uid <the UUID> --out ./edge-1
```

Copy the new files to the worker host and restart the worker.

## Revoke

```bash
uptimer worker-cert --uid <the UUID> --revoke
```

```text
Withdrawn. edge-1 is refused from its next request on.
```

The worker's next request is refused:

```text
… msg="uptimer stopped" error="ask for this worker's assignments: rpc error: code = Unauthenticated desc = this worker is not accepted"
```

Issue again to let it back in. To stop a worker without withdrawing its certificate, switch it off in **Server → Workers**.

## Coming from 1.x workers

1.x workers identified themselves with a pasted key and a UID file (`UPTIMER__WORKER__KEY_FILE` holding a key, `UPTIMER__WORKER__UUID_FILE`, `UPTIMER__WORKER__GRPC_USE_TLS`). 2.0 does not accept them, and a 1.x worker cannot talk to a 2.0 control plane.

For each 1.x worker you keep:

1. Register a 2.0 worker in the 2.0 UI under a new UUID and a 2.0 Location.
2. Issue its certificate with `worker-cert` and copy the three files to the host.
3. Run the 2.0 `uptimer worker` beside the 1.x worker, pointed at the 2.0 control plane.
4. Stop the 1.x worker when you retire the 1.x installation. See [Coming from 1.8](/v2.0.0-preview/operating/upgrading-from-1.8/).

In 2.0, `UPTIMER__WORKER__KEY_FILE` is the certificate's private key, not a 1.x key.
