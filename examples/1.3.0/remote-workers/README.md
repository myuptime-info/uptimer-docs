# Remote workers (local)

Runs the server split into services plus two workers, all on one host — the shape of a
distributed deployment. Workers reach the server over gRPC on `50051`.

## One-time bootstrap

```sh
# generate identities
docker compose run --rm uptimer-ui server init      # server.pem / server.uuid
docker compose run --rm worker1 worker init         # prints Worker UUID + Public Key
docker compose run --rm worker2 worker init

docker compose up
```

Then register each worker in the dashboard (**Server → Workers → Add**), mapping the
`worker init` output: `Worker UUID:` → **UID**, the `Public Key` PEM block → **Public Key**.

On a trusted host `UPTIMER__WORKER__GRPC_USE_TLS` is `false`; over the internet, terminate TLS at
a reverse proxy and set it `true`. See
[Remote workers](https://uptimer.myuptime.info/v1.3.0/core-concepts/remote-workers/).
