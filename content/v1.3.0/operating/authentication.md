---
title: "Authentication"
weight: 30
lede: "Dev bypass for local use, OIDC for real logins, API keys for the REST API."
description: "Dev auth, OIDC (with a Keycloak example), and API keys."
---

## Dev auth (default in the image)

The shipped image runs in dev mode, where **any visitor is logged in as an admin**
(`server.auth.dev: true`). Great for a first look, unsafe for anything reachable by others —
turn it off for real deployments.

## OIDC logins

Point Uptimer at any OIDC provider (Keycloak, Auth0, Google, …). The callback path is
`/ui/auth/oauth/callback`:

```yaml
server:
  auth:
    dev: false
    oidc:
      issuer_url:    https://id.example.com/realms/main
      client_id:     uptimer
      client_secret: "…"
      redirect_url:  https://uptimer.example.com/ui/auth/oauth/callback
```

or the matching `UPTIMER__SERVER__AUTH__OIDC__*` env vars. With OIDC configured, dev auth is off.

### Example: Keycloak

A self-contained Keycloak + Uptimer stack (full realm import in
[`examples/dev-keycloak`](https://github.com/myuptime-info/uptimer-docs/tree/main/examples/dev-keycloak)):

```yaml
services:
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    command: ["start-dev", "--import-realm"]
    ports: ["8080:8080"]
    environment:
      KC_BOOTSTRAP_ADMIN_USERNAME: admin
      KC_BOOTSTRAP_ADMIN_PASSWORD: admin
    volumes:
      - ./realm-config.json:/opt/keycloak/data/import/realm-config.json:ro
  uptimer:
    image: {{< image >}}
    command: ["--delay", "20", "dev"]   # dev command, real OIDC; delay waits for Keycloak
    ports: ["2517:2517"]
    volumes: ["./data:/data"]
    environment:
      UPTIMER__SERVER__AUTH__DEV: "false"
      UPTIMER__SERVER__AUTH__OIDC__CLIENT_ID: "uptimer-dev"
      UPTIMER__SERVER__AUTH__OIDC__CLIENT_SECRET: "1234567890"
      UPTIMER__SERVER__AUTH__OIDC__ISSUER_URL: "http://keycloak:8080/realms/uptimer-dev-keycloak-example"
      UPTIMER__SERVER__AUTH__OIDC__REDIRECT_URL: "http://uptimer-dev:2517/ui/auth/oauth/callback"
```

The imported realm defines the `uptimer-dev` client and a `test/test` user, and maps a custom
**`nickname`** claim that Uptimer uses as the username. To run it locally, map `keycloak` and
`uptimer-dev` to `127.0.0.1` in `/etc/hosts`, then `docker compose up` and sign in at
`http://uptimer-dev:2517` with `test/test`.

## API keys (REST API)

The REST API authenticates with a **Bearer token** you mint in the dashboard
(**Settings → API Keys**). Send it as `Authorization: Bearer <token>`; see the
[REST API reference](/v1.3.0/reference/rest-api/).

## Reverse-proxy auth

For a quick lock on an internal instance, add HTTP basic auth in nginx in front of the UI — see
[`examples/dev-http-auth`](https://github.com/myuptime-info/uptimer-docs/tree/main/examples/dev-http-auth).
