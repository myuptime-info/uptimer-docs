---
title: "Persistent Storage"
weight: 2
---

# 📦 Persistent Storage

This page explains how Uptimer stores data and loads configuration, and how to persist them properly in Docker setups.

---

## 🗂️ Storage overview and docker image structure

```shell
/
├── app
│    ├── configs # 
│    │    └── default.yml # default configuration file 
│    └── uptimer  # application binary, entry point
├── data  # data_dir, mount it to keep data files
```

- Uptimer uses **two main directories inside the container**:
    - `/app/configs/` — configuration files (default config lives here)
    - `/data/` — persistent data directory for worker and server files, databases, and identities

- You **must mount these directories** from the host to keep data persistent and survive container restarts.


## 📝 Configuration File

- Uptimer provides a default dev config at `/app/configs/default.yml`.
- You can override configuration by:
    - Using **environment variables** (recommended)
    - Mounting your own config file into `/app/configs/config.yml` and specifying it via `--cfg` flag.

**Copy config from image:**

```bash
mkdir -p ~/.uptimer
docker create --name temp-uptimer myuptime/uptimer
docker cp temp-uptimer:/app/configs/default.yml ~/.uptimer/config.yml
docker rm temp-uptimer
```
Edit `~/.uptimer/config.yml` as needed, then run:
```shell
docker run -p 2517:2517 \
-v "$HOME/.uptimer/config.yml:/app/configs/config.yml" \
myuptime/uptimer \
--cfg /app/configs/config.yml dev
```

Where:

* `--cfg` is a global flag (optional — uses `configs/default.yml` by default)
* `dev` is the command to run

## 📁 Data directory (/data)

* This directory contains crucial files for worker identity and server data.
* Default location inside container: /data/
* Controlled by config or environment variable `general.data_dir` (YAML) or `UPTIMER__GENERAL__DATA_DIR` (ENV)

```yaml
general:  # top level config property
  data_dir: /data/  # default value for docker, env: UPTIMER__GENERAL__DATA_DIR=/data/
```

### 📁 Worker Files to Persist
* worker.pem — worker identity certificate 
* worker.uid — worker unique ID

Backing up these files + your config file is enough to clone or restore a worker.

### 🧳 Using Subfolders for Data
You can organize multiple worker instances or configs under /data subfolders:

```text
/var/lib/uptimer/data/
├── first
├── second
```
Specify which subfolder to use via environment:

```shell
docker run -p 2517:2517 \
  -v /var/lib/uptimer/data:/data \
  -e UPTIMER__GENERAL__DATA_DIR=/data/first \
  myuptime/uptimer
```

Create new worker data files with:
```shell
docker run -p 2517:2517 \
  -v /var/lib/uptimer/data:/data \
  -e UPTIMER__GENERAL__DATA_DIR=/data/second \
  myuptime/uptimer worker init
```

### 📁 Server files
* server.pem and server.uuid — server identity and secrets
* Can be regenerated if compromised (will invalidate UI sessions)

Initialize or re-generate:

```shell
docker run -p 2517:2517 \
  -v /var/lib/uptimer/data:/data \
  myuptime/uptimer server init
```

You can add `--force` flag to regenerate em

## 🛢️ Database Configuration

* Worker database: usually sqlite3, stored inside data dir — no extra setup needed
* Server database: PostgreSQL recommended for production, SQLite3 for small setups

Worker and server can use the same database because their tables use distinct prefixes

Default settings are: 
```yaml
server:  # Optional for worker configuration
  db:
    dsn: sqlite3:///data/server_db.sqlite   # env: UPTIMER__SERVER__DB__DSN=sqlite3:///data/server_db.sqlite
worker:  # Optional for server configuration
  db:
    dsn: sqlite3:///data/worker_db.sqlite   # env: UPTIMER__WORKER__DB__DSN=sqlite3:///data/worker_db.sqlite
```

Schema migrations happen automatically on startup.


## Example: Minimalistic with persistent storages

```shell
git clone https://github.com/myuptime-info/myuptime-self-hosted-docs.git
cd myuptime-self-hosted-docs/examples/dev-persistent-no-config
docker compose up 
```

# 📌 Summary

To keep Uptimer data persistent:

* Mount the /data directory from host to container
* Optionally mount your custom config file to /app/configs/config.yml
* Use environment variables to override config values as needed
* You can organize data in subfolders and specify the path via UPTIMER__GENERAL__DATA_DIR
* PostgreSQL is recommended for the server for better performance and reliability.


##  ➡️ Next Steps

After configuring persistent storage, proceed to [Authentication](../authentication/) setup.