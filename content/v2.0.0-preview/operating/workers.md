---
title: "Workers and certificates"
weight: 40
lede: "Register a worker, issue its certificate, run it, give it confirmers, check it with --once, rotate and revoke it, and replace 1.x workers."
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

## Confirmations

From `2.0.0-rc9` a worker also answers Signal confirmations: a `problem`
reading that a Template asks to [confirm](/v2.0.0-preview/reference/rest-api/#confirming-a-problem)
is checked again before Rules believe it. A worker claims these tasks over the
same worker API connection as its checks, and answers only the tasks it
claimed, before their timeout.

| Setting | Flag | Meaning |
|---|---|---|
| `UPTIMER__WORKER__COMMANDS_FILE` | — | the named commands this worker runs; default `commands.json` in its data directory; none when the file is absent |

**Built-in probes**, always available: `reachability`, `icmp`, `tcp`, `tls`,
`http`, `dns`. Their settings come from the Template. A probe that did not get
an answer (a refused or timed-out connection, a non-matching status, a missing
DNS name) answers `problem`. A probe that could not run (settings refused, or
no ICMP on this worker) answers `no_data`, and the original reading stands. ICMP
needs unprivileged ping (`net.ipv4.ping_group_range`) or `CAP_NET_RAW`; without
either, `icmp` always answers `no_data`.

**Bounds:** a worker runs at most 4 confirmations at once, probes and commands
together. Each runs for at most 30 seconds, or less if the confirmation's
deadline comes first. Each answer is a state, an optional number (milliseconds,
days left, answers found) and at most 200 characters of reason, which never
quotes the address.

On start the worker logs what it confirms with:

```text
uptimer worker confirms with probes="[dns http icmp reachability tcp tls]" commands=[check-replica]
```

### The worker's commands file

`UPTIMER__WORKER__COMMANDS_FILE`, by default `commands.json` in the worker's
data directory:

```json
{"commands": {
  "check-replica": {
    "path": "/usr/local/lib/uptimer/check_replica",
    "args": ["--host", "{host}", "--max-lag={max_lag}"],
    "params": {"host": "[a-z0-9.-]{1,253}", "max_lag": "[0-9]{1,4}"},
    "output": "nagios",
    "timeout_seconds": 10
  }
}}
```

| Key | Meaning |
|---|---|
| command name | what a Template calls it: lowercase letters, digits, `-` and `_`, starting with a letter, up to 64 characters |
| `path` | the executable, absolute; it must exist and be executable |
| `args` | its arguments, at most 32, each passed as it is; `{name}` marks where a parameter goes |
| `params` | each parameter the command takes, with a pattern its value must match **in full**; every `{name}` in `args` must be one of these |
| `output` | `json` or `nagios` |
| `timeout_seconds` | 1 to 30 |

Unknown keys are refused. A file that is not there means no commands. A file
that is there but wrong stops the worker at start, so a mistake shows up
before a confirmation needs it. A worker is handed only the commands its file
defines.

### The Template side

```json
"signals": [{"key": "replica_lag", "kind": "event",
  "confirm": {"by": [{"exec": "check-replica", "with": {"host": {"meta": "host"}, "max_lag": 30}}],
              "refuted_if": "any_ok", "timeout": 30}}]
```

- A command takes at most 8 parameters.
- A parameter name is lowercase, up to 32 characters.
- A value is text of 1 to 256 characters, a number, or `{"meta": "field"}` for
  the Resource's own answer to a field the Template declares.
- A field with no answer leaves the parameter out. The command is then refused
  and the original reading stands.

### How a command runs

- **No shell.** The executable gets `args` as its argument list. A parameter
  fills only its `{name}` place inside one argument, so spaces, `;`, `|` or
  `$` in a value are just characters.
- **Patterns first.** A value must match its parameter's pattern in full. A
  value starting with `-` is always refused, whatever the pattern allows: a
  parameter is never an option. An undeclared, missing or over-long parameter
  is refused.
- **A clean environment.** The command sees only `PATH` and `LANG=C`, never the
  worker's own settings or certificate paths, and runs in the temp directory.
- **Bounds.**
  - It runs until the earlier of `timeout_seconds` and the confirmation's
    deadline, never more than 30 seconds. Then its whole process group is
    ended.
  - Standard output is read up to 64 KiB; standard error is discarded.
  - A worker runs at most 4 confirmations at once, probes and commands
    together.
  - The reason kept in history is at most 200 characters.

### What a command answers

- **`json`:** standard output is one object,
  `{"state": "ok" | "problem" | "no_data", "value": 12.5, "reason": "replica in sync"}`.
  Anything else is `no_data`.
- **`nagios`** (a Nagios-compatible plugin):
  - the exit code is the state: 0 is `ok`, 1 (warning) and 2 (critical) are
    `problem`, and 3 (unknown) or any other code is `no_data`;
  - the first output line, before `|`, is the reason;
  - the first performance value after `|` is the value. For example,
    `CRITICAL - replica 40s behind | lag=40s;5;10` is a `problem` with value
    40.

A command that cannot start, runs past its time, is refused, or answers
something unreadable answers `no_data`. The confirmation then keeps the
original reading.

The answer is kept with the original reading in the Resource's observation
history (API v3 `GET …/observations`, MCP `list_observations`, and the
Observations page). History never names the worker.

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
