# HTTP Basic Authentication Example

This example demonstrates how to set up HTTP Basic Authentication for Uptimer using nginx and htpasswd.

## Quick Start

### 1. Start the Services

```bash
docker-compose up -d
```

### 2. Access Uptimer

Visit `http://localhost` and log in with:
- **Username:** `admin`
- **Password:** `password`

## Configuration

### Pre-configured Setup

This example includes:
- **nginx** reverse proxy with HTTP Basic Auth
- **htpasswd** file with user `admin`/`password`
- **Uptimer** running behind the authenticated proxy

### Files

- `docker-compose.yml` - Service configuration
- `nginx.conf` - Nginx configuration with authentication
- `.htpasswd` - Password file (admin/password)
- `README.md` - This file

## Adding Users

To add more users to the htpasswd file:

```bash
# Add a new user
htpasswd .htpasswd username

# Change password for existing user
htpasswd .htpasswd username
```

## Security Notes

- This example uses HTTP for simplicity
- For production, always use HTTPS
- Change the default password immediately
- Use strong, unique passwords

## Troubleshooting

### Check Logs

```bash
# Nginx logs
docker-compose logs nginx

# Uptimer logs
docker-compose logs uptimer
```

### Common Issues

1. **Authentication fails:** Check that the htpasswd file is readable
2. **Connection refused:** Verify Uptimer is running on port 2517
3. **Permission denied:** Ensure nginx has read access to .htpasswd

## Next Steps

- [Keycloak OIDC Example](../dev-keycloak/) - Enterprise SSO
- [Production Configuration](../../../content/configuration/production/) - Production deployment 