# HTTP Basic Auth (nginx)

Puts nginx with HTTP Basic Auth in front of Uptimer — a quick lock for an internal instance.

> **Preview.** 1.6.0 is not released yet, so this compose file pulls `:edge`. When 1.6.0
> ships it is pinned to `ghcr.io/myuptime-info/uptimer:1.6.0`.

```sh
docker compose up
```

Open <http://localhost> and sign in with **admin / password**. Uptimer itself isn't published;
only nginx is.

Add or change users with `htpasswd .htpasswd <user>`. Use HTTPS in production. For real logins
see the `keycloak` example, or
[Authentication](https://uptimer.myuptime.info/v1.6.0/operating/authentication/).
