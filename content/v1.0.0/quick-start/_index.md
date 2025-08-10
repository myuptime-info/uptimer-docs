---
title: "Quick Start"
chapter: true
weight: 15
---

# 🚀 Quick Start

## ▶️ Try it

Spin up a local **demo** of Uptimer in two simple commands:


```bash
# Pull the latest image
docker pull myuptime/uptimer

# Run the container in demo mode (all-in-one)
docker run -p 2517:2517 myuptime/uptimer
```

Then open [http://127.0.0.1:2517](http://127.0.0.1:2517) in your browser:

1. Add a website check (URL + interval)
2. Set up a Slack webhook for notifications

## 🧪 Demo limitations

* Single built-in worker — no multi-region support
* No authentication — all users are treated as "Admin"
* No persistence — all data is lost when the container stops

⚠️ WARNING:

The demo version is for local testing only.
Do not expose it to the internet. It has no authentication or security features.
## ➡️ What's next?

After trying the demo, follow these steps for a production setup:

1. [Check software requirements](/v1.0.0/requirements/)
2. [Configuration basics](/v1.0.0/configuration/)
3. [Persistent storage options](/v1.0.0/configuration/storage/)
   1. Data files
   2. SQLite3 for simple deployments
   2. PostgreSQL for production use
4. [Authentication methods](/v1.0.0/configuration/authentication/)
   1. Basic HTTP Auth
   2. OAuth (with Auth0 example)
5. [Remote workers for distributed monitoring](/v1.0.0/configuration/remote-workers/)
6. [Production configuration](/v1.0.0/configuration/production/)
   1. Component architecture explanation
   2. Docker Swarm deployment examples

For a complete guide on setting up a production environment, visit our [Configuration](/v1.0.0/configuration/) section.

