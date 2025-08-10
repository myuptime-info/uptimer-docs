---
title: "Authentication"
weight: 3
---

# Authentication

## HTTP Basic Auth

- **Use case:** Add HTTP basic auth for your dev instance
- **Requirements:** nginx + htpasswd

```bash
# nginx example
git clone --branch v0.2.0  https://github.com/myuptime-info/uptimer-docs.git
cd uptimer-docs/examples/dev-http-auth
docker-compose up -d
# Access: http://localhost (admin/password)
```

[More details](http-auth/)

## OIDC with Keycloak

- **Use case:** Self-hosted identity provider
- **Requirements:** Keycloak server
- **Requirements:** keycloak and uptimer-dev hostnames must be resolved to localhost

```bash
git clone --branch v0.2.0  https://github.com/myuptime-info/uptimer-docs.git
cd uptimer-docs/examples/dev-keycloak
docker-compose up -d
# Access: http://localhost:2517 (test/test)
```

[More details](keycloak/)

## OIDC with Auth0 (Cloud)

- **Use case:** Cloud identity provider
- **Requirements:** Auth0 application

Similar to Keycloak, but requires Auth0 account configuration.

[More details](auth0/)

# All auth settings

## Config and Environment Variables

```yaml
server:
  auth:
    dev: false  # true - enable dev mode, false - disable
    oidc:
      client_id: "your-client-id"  # UPTIMER__SERVER__AUTH__OIDC__CLIENT_ID
      client_secret: "your-client-secret"  # UPTIMER__SERVER__AUTH__OIDC__CLIENT_SECRET
      issuer_url: "https://your-issuer.com"  # UPTIMER__SERVER__AUTH__OIDC__ISSUER_URL
      redirect_url: "http://your-domain/auth/callback"  # UPTIMER__SERVER__AUTH__OIDC__REDIRECT_URL
```


