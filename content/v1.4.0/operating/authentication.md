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
[`examples/1.4.0/keycloak`](https://github.com/myuptime-info/uptimer-docs/tree/main/examples/1.4.0/keycloak)):

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

### Logging out of the provider

**New in 1.4.0.** Signing out now ends the session at your identity provider too, not just in
Uptimer. Before this, dropping the Uptimer cookie left the provider's SSO cookie alive, so the
next login silently signed the same person straight back in — you could not switch users without
clearing cookies by hand.

Nothing to configure for a provider that advertises `end_session_endpoint` in its discovery
document (Keycloak does). For one that doesn't, name the endpoint yourself:

```yaml
server:
  auth:
    oidc:
      end_session_endpoint:       https://id.example.com/v2/logout
      post_logout_redirect_param: returnTo
```

| Setting | Meaning |
|---|---|
| `end_session_endpoint` | The provider's logout URL. **Overrides discovery** — set it only when discovery has none, or when you deliberately want a different endpoint. |
| `post_logout_redirect_param` | The query parameter carrying the return URL. Defaults to `post_logout_redirect_uri`, which is what the spec calls it. |

Providers that keep OIDC session management switched off advertise no endpoint and rename the
parameter:

| Provider | `end_session_endpoint` | `post_logout_redirect_param` |
|---|---|---|
| Keycloak | *(from discovery — leave empty)* | *(default)* |
| Auth0 | `https://<tenant>/v2/logout` | `returnTo` |
| AWS Cognito | `https://<domain>/logout` | `logout_uri` |

**Allow-list the return URL at the provider.** Uptimer sends the browser back to
`general.site_url` (with a trailing `/`), falling back to the request's own scheme and host when
`site_url` is unset. Providers reject a logout whose return URL is not registered, so add that
exact URL to the client's post-logout / allowed-logout-URL list.

If neither configuration nor discovery names an endpoint, logout still works — it just clears
the local session only, and the server logs one line saying so at startup.

> **Large ID tokens fall back automatically.** The `id_token_hint` is kept in a cookie, and
> browsers silently drop cookies over ~4 KB. A token fat with group or role claims is therefore
> not stored, and logout is sent with `client_id` instead — which RP-initiated logout permits,
> since the hint is recommended rather than required. You get a warning in the log when this
> happens.

## API keys (REST API)

The REST API authenticates with a **Bearer token** you mint in the dashboard
(**User → API Keys**). Send it as `Authorization: Bearer <token>`; see the
[REST API reference](/v1.4.0/reference/rest-api/).

## Reverse-proxy auth

For a quick lock on an internal instance, add HTTP basic auth in nginx in front of the UI — see
[`examples/1.4.0/http-auth`](https://github.com/myuptime-info/uptimer-docs/tree/main/examples/1.4.0/http-auth).
