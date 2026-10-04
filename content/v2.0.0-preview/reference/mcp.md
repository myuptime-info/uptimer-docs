---
title: "MCP (installed binary)"
weight: 30
lede: "Let an AI client read your Uptimer, and act on it if you allow it, with one scoped API key."
---

`uptimer mcp` lets an AI client (Claude Desktop, Claude Code, Cursor, MCP
Inspector, …) read your Resources and Incidents, and act on them if you allow
it. The client starts the installed `uptimer` binary and talks to it over
stdin and stdout. Nothing else to install.

The tools call [API v3](/v2.0.0-preview/reference/rest-api/) with one API key. They have no database
access and no permissions of their own: the key decides.

## 1. Make a key

In the UI: **API keys → New key**.

- **Access: Scoped** and a **Workspace**. Leave every action unticked for a
  read-only agent.
- Tick **Acknowledge Incidents**, **Start and end maintenance** or **Send
  Observations** only for the actions the agent may take.

A full key also works, but it acts as you in every Workspace.

## 2. Add it to your client

```json
{
  "mcpServers": {
    "uptimer": {
      "command": "/usr/local/bin/uptimer",
      "args": ["--mcp"],
      "env": {
        "UPTIMER_MCP_API_KEY": "<the token>",
        "UPTIMER_MCP_URL": "https://uptimer.example.com"
      }
    }
  }
}
```

Claude Code:

```bash
claude mcp add uptimer \
  -e UPTIMER_MCP_API_KEY=<the token> \
  -e UPTIMER_MCP_URL=https://uptimer.example.com \
  -- /usr/local/bin/uptimer mcp
```

`uptimer --mcp` and `uptimer mcp` are the same. `--token` and `--url` exist,
but a token on the command line shows in `ps`, so use the environment.
`UPTIMER_MCP_URL` is where the UI is served (default
`http://localhost:8080`); the API port works too.

With Docker, run the image instead of a local binary:

```json
"command": "docker",
"args": ["run", "-i", "--rm", "-e", "UPTIMER_MCP_API_KEY", "-e", "UPTIMER_MCP_URL",
         "{{< image >}}", "mcp"]
```

The key is checked on start. A refused key stops `uptimer mcp` with a message
on stderr; logs never go to stdout.

## Tools

| Tool | Needs | What it does |
|---|---|---|
| `list_workspaces` | read | Workspaces the key reaches, with your role |
| `list_resources` | read | Resources with their open Incident (at most 50) |
| `get_resource` | read | Signals, Rules with their result and explanation, maintenance |
| `list_observations` | read | newest Observations of a Resource (1–50) |
| `list_incidents` | read | Incidents, newest first; filters and a cursor (1–50) |
| `get_incident` | read | one Incident and its recorded history |
| `list_incident_deliveries` | read | what was sent about an Incident: delivered, failed or held, with a reason code |
| `acknowledge_incident` | `acknowledge` | take an open Incident on |
| `start_maintenance`, `end_maintenance` | `maintenance` | hold or release a Resource's notifications |
| `send_test_observation` | `observe` | send one Observation, labelled `source: mcp-test` |

A write tool is listed only when the key has its action, and API v3 checks it
again on every call. With a key for one Workspace, the `workspace` argument
can be left out.

Results carry API v3's answer as `result` (and `next_cursor` for a page).
Errors carry API v3's error as it came: `code`, `error_type`, `message`,
`details`. Ids are the same public ids as the API and the UI. Tokens,
destination URLs, delivery payloads and what a destination answered never
appear: a failed delivery says only `unreachable`, `http_NNN` or `not_sent`.

## A read flow

Ask the client, for example: "Which Incidents are open in Uptimer, and why?"
It calls `list_incidents` with `lifecycle: open`, then `get_incident` for the
history and `list_incident_deliveries` for who was told.

## Audit

Recorded in `server_api_audit` for every key: each write, refused ones too,
and each read of recorded evidence (`get_incident`, `list_incident_deliveries`,
`list_observations`). Each row names the key, the person, the Workspace, the
path, the status and `uptimer-mcp/<version>` as the agent. Lists
(`list_workspaces`, `list_resources`, `list_incidents`) and `get_resource` are
not recorded.
