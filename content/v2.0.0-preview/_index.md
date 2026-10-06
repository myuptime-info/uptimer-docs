---
title: "Uptimer v2.0.0-preview"
lede: "Self-hosted monitoring that explains every decision: Resources, Signals, Rules and Incidents."
description: "Uptimer 2.0.0-preview: self-hosted monitoring that explains every decision."
---

These pages describe the Uptimer 2.0 release candidate for the field test. Commands
use the preview image `{{< image >}}`. Uptimer 1.x stays the current release: its
documentation is at [/latest/](/latest/).

Uptimer watches your services and tells you, with its reasons, when one is in trouble.

- A **Resource** is something you watch: a website, an API, a job.
- A **Signal** is one stream of evidence about it. A managed worker or your own scripts send
  **Observations** on it.
- A **Rule** reads the Signals and decides whether the Resource is in trouble.
- An **Incident** is one period of trouble from one Rule. It has a lifecycle (open, closed), a
  confirmation (confirmed, unconfirmed) and a history.
- A **Workspace** holds Resources and their people. Everyone gets one, named Default, at first
  sign-in; rename it and invite members under **Settings**.

## The field-test path

1. [Quickstart](/v2.0.0-preview/getting-started/quick-start/): run Uptimer and one worker with
   Docker Compose and watch a website until it opens an Incident.
2. [From an API key to an Incident](/v2.0.0-preview/getting-started/first-incident/): create a
   Resource, send an Observation and read the Rule result and the Incident with API v3 and the
   local Python SDK wheel.
3. [Triage pushed fleet signals](/v2.0.0-preview/getting-started/pushed-triage/): publish a
   workerless Template and get access_loss, service_down or probe_issue from what your systems push.
4. [Run it for real](/v2.0.0-preview/operating/running/):
   [PostgreSQL](/v2.0.0-preview/operating/database/),
   [OIDC sign-in](/v2.0.0-preview/operating/sign-in/),
   [workers and their certificates](/v2.0.0-preview/operating/workers/),
   [logs and Sentry](/v2.0.0-preview/operating/logging/).
5. [Coming from 1.8](/v2.0.0-preview/operating/upgrading-from-1.8/): 2.0 is a fresh installation.

AI tools can use Uptimer through the [installed binary's MCP mode](/v2.0.0-preview/reference/mcp/),
and search these pages through the [docs MCP](/v2.0.0-preview/reference/docs-mcp/).
