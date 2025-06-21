---
title: "Keycloak OIDC Authentication"
weight: 2
---

# Keycloak OIDC Authentication

OpenID Connect authentication using Keycloak with custom claims support.

## Quick Start

To run examples you need the following domain name resolving config:

* keycloak -> 127.0.0.1
* uptimer-dev -> 127.0.0.1

```bash
# 1. Add to /etc/hosts
echo "127.0.0.1 keycloak uptimer-dev" | sudo tee -a /etc/hosts

# 2. Start services
git clone https://github.com/myuptime-info/myuptime-self-hosted-docs.git
cd myuptime-self-hosted-docs/examples/dev-keycloak
docker-compose up -d

# 3. Access services
# Keycloak: http://localhost:8080 (admin/admin)
# Uptimer: http://localhost:2517 (test/test)
```

* `http://keycloak:8080` - localhost Keycloak address, credentials `admin/admin`
* `http://uptimer-dev` - Uptimer local address, credentials `test/test`

## Explanation

### docker-compose.yml
```yaml
version: '3.8'
services:
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    ports:
      - "8080:8080"
    environment:
      KC_BOOTSTRAP_ADMIN_USERNAME: admin
      KC_BOOTSTRAP_ADMIN_PASSWORD: admin
      KC_IMPORT: /opt/keycloak/data/import/realm-config.json
    volumes:
      - ./realm-config.json:/opt/keycloak/data/import/realm-config.json:ro
    command: ["start-dev", "--import-realm"]

  uptimer-dev:
    image: myuptime/uptimer
    ports:
      - "2517:2517"
    volumes:
      - ./data:/data
    environment:
      UPTIMER__SERVER__AUTH__DEV: "false"
      UPTIMER__SERVER__AUTH__OIDC__CLIENT_ID: "uptimer-dev"
      UPTIMER__SERVER__AUTH__OIDC__CLIENT_SECRET: "1234567890"
      UPTIMER__SERVER__AUTH__OIDC__ISSUER_URL: "http://keycloak:8080/realms/uptimer-dev-keycloak-example"
      UPTIMER__SERVER__AUTH__OIDC__REDIRECT_URL: "http://uptimer-dev:2517/ui/auth/oauth/callback"
    command: ["--delay", "20", "dev"]
```

### realm-config.json

In short, it:

1. Contains "client" (application) configuration - uptimer-dev
2. Contains test/test user with nickname configured
3. Custom claim "nickname" that will be used as username

```json
{
  "realm": "uptimer-dev-keycloak-example",
  "enabled": true,
  "clients": [
    {
      "clientId": "uptimer-dev",
      "secret": "1234567890",
      "redirectUris": ["http://uptimer-dev:2517/ui/auth/oauth/callback"],
      "protocolMappers": [
        {
          "name": "nickname",
          "protocol": "openid-connect",
          "protocolMapper": "oidc-usermodel-attribute-mapper",
          "config": {
            "user.attribute": "nickname",
            "claim.name": "nickname",
            "jsonType.label": "String",
            "id.token.claim": "true",
            "access.token.claim": "true",
            "userinfo.token.claim": "true",
            "full.group.path": "false"
          }
        }
      ]
    }
  ],
  "users": [
    {
      "username": "test",
      "enabled": true,
      "emailVerified": true,
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com",
      "attributes": {
        "nickname": ["TestUser"]
      },
      "credentials": [
        {
          "type": "password",
          "value": "test",
          "temporary": false
        }
      ]
    }
  ]
}
```

Pre-configured realm with test user and custom claims support.

## Auth Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `UPTIMER__SERVER__AUTH__OIDC__CLIENT_ID` | OIDC client ID | `uptimer-dev` |
| `UPTIMER__SERVER__AUTH__OIDC__CLIENT_SECRET` | OIDC client secret | `1234567890` |
| `UPTIMER__SERVER__AUTH__OIDC__ISSUER_URL` | Keycloak realm URL | `http://keycloak:8080/realms/uptimer-dev-keycloak-example` |
| `UPTIMER__SERVER__AUTH__OIDC__REDIRECT_URL` | OAuth callback URL | `http://uptimer-dev:2517/ui/auth/oauth/callback` |

## Auth Config File
```yaml
server:
  auth:
    dev: false  # should be false when OIDC is used
    oidc:
      client_id: "uptimer-prod"  # UPTIMER__SERVER__AUTH__OIDC__CLIENT_ID
      client_secret: "your-production-secret" # UPTIMER__SERVER__AUTH__OIDC__CLIENT_SECRET
      issuer_url: "https://your-keycloak-domain/realms/your-realm" # UPTIMER__SERVER__AUTH__OIDC__ISSUER_URL
      redirect_url: "https://your-uptimer-domain/ui/auth/oauth/callback" # UPTIMER__SERVER__AUTH__OIDC__REDIRECT_URL
```
