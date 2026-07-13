---
title: "Uptimer v1.3.0"
lede: "Self-hosted uptime & synthetic monitoring in a single Go binary — up and running in one command."
description: "Uptimer — self-hosted uptime monitoring you can run in one command."
---

Uptimer watches your HTTP(S) endpoints on a schedule, from one or many regions, and alerts you
the moment they break. One Go binary under 100 MB, with a REST API the dashboard itself is built
on — anything you can click, you can script.

## Open source, or hosted — one engine

Run it yourself (these docs) or use the hosted service at
[myuptime.info](https://myuptime.info). **Same engine, same REST API.** Your data stays yours:
export any time and move between self-hosted and cloud — no vendor lock-in.

## Try it in one command

```sh
docker run -p 2517:2517 {{< image >}}
```

Open **http://127.0.0.1:2517** and you're in — add a rule, point it at a URL, watch it go
up or down. The REST API is on the same port, under `/api`:

```sh
curl http://127.0.0.1:2517/api/version
```
```json
{ "result": "1.3.0", "error": null, "meta": null }
```

That's **dev mode**: one process, fake auth, throwaway data — great for a look.
[Quick start](/v1.3.0/getting-started/quick-start/) explains what just happened;
[Self-hosting](/v1.3.0/getting-started/self-hosting/) turns it into a real deployment.

## Explore
