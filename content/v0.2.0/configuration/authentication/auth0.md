---
title: "Auth0 OIDC Authentication"
weight: 3
---

# Auth0 OIDC Authentication

OpenID Connect authentication using Auth0 cloud service.

## Auth0 Configuration

### 1. Create Application
1. Login to [Auth0 Dashboard](https://manage.auth0.com)
2. Create Application:
   - Name: `Uptimer`
   - Type: `Single Page Application`

### 2. Application Settings
```
Application Type: Single Page Application
Token Endpoint Authentication Method: None
Allowed Callback URLs: http://localhost:2517/ui/auth/oauth/callback
Allowed Logout URLs: http://localhost:2517
Allowed Web Origins: http://localhost:2517
```

**Production:**
```
Allowed Callback URLs: https://your-domain.com/ui/auth/oauth/callback
Allowed Logout URLs: https://your-domain.com
Allowed Web Origins: https://your-domain.com
```

## Configuration Files

### docker-compose.yml
```yaml
version: '3.8'
services:
  uptimer:
    image: myuptime/uptimer
    ports:
      - "2517:2517"
    volumes:
      - ./data:/data
    environment:
      UPTIMER__SERVER__AUTH__DEV: "false"
      UPTIMER__SERVER__AUTH__OIDC__CLIENT_ID: "your-auth0-client-id"
      UPTIMER__SERVER__AUTH__OIDC__CLIENT_SECRET: "your-auth0-client-secret"
      UPTIMER__SERVER__AUTH__OIDC__ISSUER_URL: "https://your-tenant.auth0.com"
      UPTIMER__SERVER__AUTH__OIDC__REDIRECT_URL: "http://localhost:2517/ui/auth/oauth/callback"
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `UPTIMER__SERVER__AUTH__OIDC__CLIENT_ID` | Auth0 client ID | `abc123def456` |
| `UPTIMER__SERVER__AUTH__OIDC__CLIENT_SECRET` | Auth0 client secret (empty for SPA) | `` |
| `UPTIMER__SERVER__AUTH__OIDC__ISSUER_URL` | Auth0 domain | `https://your-tenant.auth0.com` |
| `UPTIMER__SERVER__AUTH__OIDC__REDIRECT_URL` | OAuth callback URL | `http://localhost:2517/ui/auth/oauth/callback` |

## Config file example for auth0
```yaml
server:
  auth:
    dev: false  # should be false when OIDC is used
    oidc:
      client_id: "your-auth0-client-id"  # UPTIMER__SERVER__AUTH__OIDC__CLIENT_ID
      client_secret: "your-auth0-client-secret" # UPTIMER__SERVER__AUTH__OIDC__CLIENT_SECRET
      issuer_url: "https://your-tenant.auth0.com" # UPTIMER__SERVER__AUTH__OIDC__ISSUER_URL (Auth0 domain)
      redirect_url: "http://uptimer-domain:port/ui/auth/oauth/callback" # UPTIMER__SERVER__AUTH__OIDC__REDIRECT_URL (domain for your Uptimer instance)
```
