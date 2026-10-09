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
- Tick **Acknowledge Incidents**, **Start and end maintenance**, **Send
  Observations**, **Publish Templates** or **Create and archive Resources**
  only for the actions the agent may take. A fleet triage agent needs the last
  three.

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
| `create_workspace` | full key | create a Workspace you own, by `name`; answers its id. A scoped key does not have it. From the release candidate after `2.0.0-rc2` |
| `list_resources` | read | a page of Resources with their open Incident; `template`, `state` (active, archived, all), `meta` field values, `cursor` (1–50) |
| `list_templates` | read | the Templates Resources here can be made from, every revision |
| `get_resource` | read | Signals, Rules with their result and explanation, maintenance |
| `list_observations` | read | newest Observations of a Resource (1–50) |
| `list_incidents` | read | Incidents, newest first; filters including `rule`, `lifecycle`, `acknowledged` (true or false; after `2.0.0-rc2`), `template`, `resource_state` and `meta`, and a cursor (1–50) |
| `get_incident` | read | one Incident and its recorded history, with each transition's input `evidence` |
| `list_incident_deliveries` | read | what was sent about an Incident: delivered, failed or held, with a reason code |
| `acknowledge_incident` | `acknowledge` | take an open Incident on |
| `start_maintenance`, `end_maintenance` | `maintenance` | hold or release a Resource's notifications |
| `send_test_observation` | `observe` | send one Observation, labelled `source: mcp-test` |
| `send_observation` | `observe` | push one Observation: `state` ok, problem or no_data, a numeric `value`, optional `at`, `id` and `reason` (a short why, kept with the evidence and alert) |
| `publish_template` | `templates` | publish a pushed-data Template revision (the API v3 manifest); after `2.0.0-rc3` its Rules may use `known`, `all_known` and `any_known` ([any number of probes](/v2.0.0-preview/getting-started/pushed-triage/)); after `2.0.0-rc4` each Rule may set `routes` ([route by Rule and transition](/v2.0.0-preview/getting-started/pushed-triage/#route-by-rule-and-transition)) |
| `create_resource`, `archive_resource` | `resources` | create a Resource from a Template by your own key; archive one |
| `rebind_resource` | full key | move a pushed-data Resource to another published revision (`template`, `meta`), keeping its id and key; after `2.0.0-rc2` |
| `list_destinations` | full key | the Workspace's destinations: id, name, type, channel, enabled, `send_on_open`, default; never a URL. After `2.0.0-rc5` |
| `create_destination`, `update_destination` | full key | add a Slack or webhook destination (`name`, `type`, `url`, …), or change one; its URL is never shown back |
| `delete_destination` | full key | delete one; refused with `used_by` while a live route still uses it |
| `test_destination` | full key | send the test message; `delivered`, or `failed` with a reason code |
| `list_destination_deliveries` | full key | what was sent to one destination, newest first, with a cursor |

A write tool is listed only when the key has its action, and API v3 checks it
again on every call. With a key for one Workspace, the `workspace` argument
can be left out.

Results carry API v3's answer as `result` (and `next_cursor` for a page).
Errors carry API v3's error as it came: `code`, `error_type`, `message`,
`details`. Ids are the same public ids as the API and the UI. Tokens,
destination URLs, delivery payloads and what a destination answered never
appear: a failed delivery says only `unreachable`, `http_NNN` or `not_sent`.
With a scoped key, a Resource's secret Template fields read `[redacted]` and
its URL fields carry no user info or credential-named query values; so do
Template field defaults. An Observation label whose name marks a credential
(`api_token`, `Authorization`, …) reads `[redacted]`; other labels stay. Editing a
Resource stays a full key's, so a redacted value is never written back. A full
key reads the real values.

Not everything has a tool. After `2.0.0-rc3`, the `opened` webhook event is
switched on per webhook destination in the UI (**Settings**, the destination's
**Also send when an Incident opens**; after `2.0.0-rc5` also `send_on_open` in
`create_destination` and `update_destination`), and the Resource page's recorded decision evidence,
latest Signals, and the list's age and open-Incident sorting are in the
browser only. A Template's Rules cannot select Observation labels
([REST API](/v2.0.0-preview/reference/rest-api/)); MCP adds none.

## A read flow

Ask the client, for example: "Which Incidents are open in Uptimer, and why?"
It calls `list_incidents` with `lifecycle: open`, then `get_incident` for the
history and `list_incident_deliveries` for who was told.

## A triage flow

With a key scoped to **Send Observations**, **Publish Templates** and
**Create and archive Resources**, a client can run the
[pushed-fleet triage](/v2.0.0-preview/getting-started/pushed-triage/)
end to end, on the same API v3 behaviour:

1. `publish_template` with the guide's `service-triage.json` as `manifest`.
2. `create_resource` `{template: "service-triage", key: "srv-0042", meta: {provider: "alpha"}}`.
3. `send_observation` for `probe_a`, `probe_b`, `origin`, `service_health`
   (`state`), and `load_ratio` (`state: ok`, `value: 0.1`), or
   `state: no_data` when the ratio is not valid.
4. `list_incidents` `{template: "service-triage", meta: {provider: "alpha"}}`,
   then `get_incident` for the transition evidence.
5. `archive_resource` for a server that left the inventory.

## Audit

Recorded in `server_api_audit` for every key: each write, refused ones too,
and each read of recorded evidence (`get_incident`, `list_incident_deliveries`,
`list_observations`). Each row names the key, the person, the Workspace, the
path, the status and `uptimer-mcp/<version>` as the agent. Lists
(`list_workspaces`, `list_resources`, `list_incidents`) and `get_resource` are
not recorded.
