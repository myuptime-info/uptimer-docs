---
title: "Authentication"
weight: 30
lede: "Dev bypass for local use, OIDC for real logins, API keys for the REST API."
description: "Dev auth, OIDC, and API keys."
---

## Dev auth (default in the image)

The shipped image runs in dev mode, where **any visitor is logged in as an admin**
(`server.auth.dev: true`). Great for a first look, unsafe for anything reachable by others —
turn it off for real deployments.

## OIDC (production logins)

Point Uptimer at any OIDC provider (Keycloak, Auth0, Google, …):

```yaml
server:
  auth:
    oidc:
      client_id:     uptimer
      client_secret: "…"
      issuer_url:    https://id.example.com/realms/main
      redirect_url:  https://uptimer.example.com/auth/callback
```

or via `UPTIMER__SERVER__AUTH__OIDC__CLIENT_ID`, etc. With OIDC configured, dev auth is off.

## API keys (REST API)

The REST API authenticates with a **Bearer API key** — a long-lived token you mint in the
dashboard (**Settings → API Keys**). Send it as `Authorization: Bearer <key>`; see the
[REST API reference](/v1.3.0/reference/rest-api/).

> Behind a reverse proxy you can add another layer (e.g. HTTP basic auth in nginx) in front of
> the UI. Uptimer doesn't require it, but it's a simple lock for an internal instance.
