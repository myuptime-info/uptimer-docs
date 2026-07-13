# OIDC login with Keycloak

A self-contained Keycloak + Uptimer stack. The imported realm defines the `uptimer-dev` client
and a `test / test` user, and maps a custom `nickname` claim that Uptimer uses as the username.

```sh
# resolve the hostnames the realm/redirect URLs use
echo "127.0.0.1 keycloak uptimer-dev" | sudo tee -a /etc/hosts

docker compose up
```

- Uptimer: <http://uptimer-dev:2517> — sign in with **test / test**
- Keycloak admin: <http://localhost:8080> — **admin / admin**

The OIDC callback path is `/ui/auth/oauth/callback`. See
[Authentication](https://uptimer.myuptime.info/v1.3.0/operating/authentication/#example-keycloak).
