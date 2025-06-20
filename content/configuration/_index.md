---
title: "Configuration"
chapter: true
weight: 25
---

# 🛠️ Configuration

## ⚙️ Basics

Uptimer supports configuration via a YAML file and environment variables.

### 🌍 Environment Variables

- Prefix: `UPTIMER__`
- Keys are uppercase
- Nested keys use double underscores `__` to join levels

### 🗂️ Default Config File

The default config for the Docker image is at `/app/configs/default.yml`. It enables dev mode by default:

```yaml
server:
  ui:
    port: 2517 # env: UPTIMER__SERVER__UI__PORT=2517
  auth:
    dev: true # env: UPTIMER__SERVER__AUTH__DEV=true
  db:
    dsn: sqlite3:///data/server_db.sqlite # env: UPTIMER__SERVER__DB__DSN=sqlite3:///data/server_db.sqlite
worker:
  db:
    dsn: sqlite3:///data/worker_db.sqlite # env: UPTIMER__WORKER__DB__DSN=sqlite3:///data/worker_db.sqlite
general:
  data_dir: /data/ # env: UPTIMER__GENERAL__DATA_DIR=/data/
  logging:
    level: DEV # values: DEV, PROD, env: UPTIMER__GENERAL__LOGGING__LEVEL=DEV
    sql: SILENT # values: ERROR, SILENT, WARN, INFO, env: UPTIMER__GENERAL__LOGGING__SQL=SILENT
```

Additional config options are documented in related sections.

## ➡️ Next 

After trying the demo version of MyUptime Self-Hosted, you can set up a more complete installation with the following steps:

| Topic                                        | Description |
|----------------------------------------------|-------------|
| 📦 [Persistent Storage](./storage/)          | Configure persistent storage options (SQLite3 or PostgreSQL) |
| 🔐 Authentication *(Coming Soon)*            | Set up authentication methods (Basic HTTP Auth or OAuth)  |
| 🌐 Remote Workers *(Coming Soon)*            | Deploy and configure remote workers for distributed monitoring |
| 🛳️ Production Configuration *(Coming Soon)* | Configure MyUptime for production use with component architecture and deployment examples |

Follow the guides in order for full setup or jump to sections as needed.
