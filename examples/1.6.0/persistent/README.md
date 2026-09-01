# Persistent dev (PostgreSQL)

A single Uptimer container in dev mode, backed by PostgreSQL so data survives restarts.

> **Preview.** 1.6.0 is not released yet, so this compose file pulls `:edge`. When 1.6.0
> ships it is pinned to `ghcr.io/myuptime-info/uptimer:1.6.0`.

```sh
docker compose up
```

Open <http://localhost:2517> (dev mode — any visitor is an admin). The server database lives in
Postgres (`uptimer_server`); the server/worker identity keys live in `./data`.

This is step 2–3 of [Self-hosting](https://uptimer.myuptime.info/v1.6.0/getting-started/self-hosting/).
For real logins add OIDC (see the `keycloak` example); for a production topology see the
`remote-workers` example and the docs' Production deployment page.
