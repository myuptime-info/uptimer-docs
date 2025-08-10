---
title: "Remote Workers"
weight: 4
bookCollapseSection: false
---

# 🌐 Remote Workers

Remote workers distribute monitoring across multiple locations or networks. 

⚠️ **Note**: Remote workers are not available in demo mode. You must run all services independently.

---

## 🏗️ Architecture Overview

Main Uptimer components:

### Server
- 🌐 **UI** - Web interface for configuration and monitoring
- 🔌 **gRPC** - Communication endpoint for workers (must be accessible from worker locations)
- ⚙️ **API** - REST API for external integrations and data access
- 📊 **Availabilities** - Background job to process results from workers

### Worker Services
- **🤖 Remote Workers** - Distributed monitoring agents that perform checks

---

## 🚀 Quick Setup

This example shows a basic Docker Compose setup for remote workers. For production deployments, see the [Production Configuration](/v1.0.0/configuration/production/) guide.

### 1. Prepare Your Environment

```bash
# Clone the documentation repository
git clone https://github.com/myuptime-info/uptimer-docs.git
cd uptimer-docs/examples/multiple-worker-local
```

### 2. Initialize Services

```bash
# Initialize server data
docker compose run uptimer-ui server init

# Initialize worker1 (copy the output for later use)
docker compose run worker1 worker init
# Files created: data/worker1/worker.pem, data/worker1/worker.uid

# Initialize worker2 (copy the output for later use)  
docker compose run worker2 worker init
# Files created: data/worker2/worker.pem, data/worker2/worker.uid

# Start all services
docker compose up
```

### 3. Configure Workers in UI

1. Open [http://127.0.0.1:2517](http://127.0.0.1:2517) in your browser
2. Navigate to **Server → Workers** in the sidebar
3. Click **Add Worker** and fill in:
   - **UID**: Value from `docker compose run worker1 worker init` output
   - **Name**: Descriptive name (e.g., "Worker 1")
   - **Public Key**: Full public key from the init command output

4. Repeat for the second worker

### 4. Create a Check

1. Create a new check in the UI
2. Select multiple workers from the **Regions** menu
3. Set your desired interval
4. Save the check

Results will now come from all selected workers! 🎉

---

## 📋 Docker Compose Configuration

Here's the complete `docker-compose.yml` for a multi-worker setup:

```yaml
services:
  uptimer-ui:  # service website
    image: myuptime/uptimer
    command: ["server", "--services", "ui"]
    ports:
      - "2517:2517"
    volumes:
      - ./data/server:/data
  uptimer-grpc:  # grpc server
    image: myuptime/uptimer
    command: ["server", "--services", "grpc"]
    environment:
      UPTIMER__GRPC__PORT: 2518
    ports:
      - "2518:2518"
    volumes:
      - ./data/server:/data
  uptimer-jobs:  # background jobs
    image: myuptime/uptimer
    command: ["server", "--services", "availabilities"]
    volumes:
      - ./data/server:/data

  worker1:  # worker1
    image: myuptime/uptimer
    volumes:
      - ./data/worker1:/data
    environment:
      UPTIMER__WORKER__GRPC_SERVER: uptimer-grpc:2518
      UPTIMER__WORKER__GRPC_USE_TLS: false
    command: worker
    depends_on:
      - uptimer-grpc

  worker2:  # worker2
    image: myuptime/uptimer
    volumes:
      - ./data/worker2:/data
    environment:
      UPTIMER__WORKER__GRPC_SERVER: uptimer-grpc:2518
      UPTIMER__WORKER__GRPC_USE_TLS: false
    command: worker
    depends_on:
      - uptimer-grpc

```

---

## 🔒 Production SSL Configuration

### SSL Termination with Load Balancer

If you're using an API gateway or load balancer with SSL termination:

1. **Configure workers to use SSL**:
   ```yaml
   environment:
     UPTIMER__WORKER__GRPC_USE_TLS: true  # Enable TLS
   ```

2. **Set up nginx reverse proxy** for SSL termination:
   - See our [nginx configuration example](https://github.com/myuptime-info/uptimer-docs/blob/main/examples/dev-http-auth/nginx.conf) for reference
   - Configure routes to forward gRPC traffic to the gRPC server
   - Ensure proper SSL certificate configuration

### Direct SSL Configuration

For direct SSL without termination:
- Configure SSL certificates on the gRPC server
- Set `UPTIMER__WORKER__GRPC_USE_TLS: true` on all workers
- Ensure proper certificate validation

⚠️ **Security Note**: Never use `GRPC_USE_TLS: false` in production environments.

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Workers can't connect to gRPC | Check firewall rules and network connectivity |
| Worker init fails | Ensure proper volume permissions |
| UI shows no workers | Verify worker UID and public key are correct |
| Checks not running | Confirm worker is registered and active |

### Debug Commands

```bash
# Check worker logs
docker compose logs worker1

# Verify gRPC server is accessible
telnet your-grpc-server 2518

# Test worker connectivity
docker compose exec worker1 ping uptimer-grpc
```

---

## ➡️ Next Steps

- [Production Configuration](/v1.0.0/configuration/production/) - Learn about production deployment patterns
- [Authentication Setup](/v1.0.0/configuration/authentication/) - Secure your installation
- [Storage Configuration](/v1.0.0/configuration/storage/) - Configure persistent data storage

For advanced deployment patterns, check out our [Docker Swarm examples](/v1.0.0/configuration/production/) in the production configuration guide. 