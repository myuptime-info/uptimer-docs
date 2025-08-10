---
title: "HTTP Basic Authentication"
weight: 1
---

# HTTP Basic Authentication

Simple username/password authentication using nginx and htpasswd.

## Quick Start

```bash
# nginx example
git clone https://github.com/myuptime-info/uptimer-docs.git
cd uptimer-docs/examples/dev-http-auth
docker-compose up -d
# Access: http://localhost (admin/password)
```

## Explanation

### docker-compose.yml
```yaml
services:
  uptimer:
    image: myuptime/uptimer
    volumes:
      - ./data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./.htpasswd:/etc/nginx/.htpasswd:ro
    depends_on:
      - uptimer 
```

Runs Uptimer in dev mode and uses nginx to handle HTTP auth and proxying.

### nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    include       mime.types;
    charset       utf-8;

    upstream ui {
        server uptimer:2517;
    }

    server {
        listen 80;
        server_name localhost;

        # HTTP Basic Authentication
        auth_basic "Restricted Access";
        auth_basic_user_file /etc/nginx/.htpasswd;

        location / {
            proxy_pass http://ui;
            proxy_next_upstream error http_502;
            proxy_set_header Host $host;
        }
    }
} 
```

## User Management

```bash
# Add user
htpasswd .htpasswd username

# Change password
htpasswd .htpasswd username
```

## Troubleshooting

### Check Logs
```bash
docker-compose logs nginx
docker-compose logs uptimer
```
