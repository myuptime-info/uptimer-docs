---
title: "API Examples"
weight: 105
---

# API Examples

Basic usage examples.

## Authentication Setup

```bash
export UPTIMER_TOKEN="your_jwt_token_here"
```

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

## Basic Operations

### Create Rule

```bash
curl -X POST https://your-uptimer-instance.com/api/v1/rules \
  -H "Authorization: Bearer $UPTIMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website Health Check",
    "interval": 300,
    "workspace_id": "ws_123456",
    "request": {
      "url": "https://example.com",
      "method": "GET"
    },
    "response": {
      "statuses": [200]
    }
  }'
```

```text
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### List Workspaces

```bash
curl -X GET https://your-uptimer-instance.com/api/v1/workspaces \
  -H "Authorization: Bearer $UPTIMER_TOKEN"
```

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

### List Rules

```bash
curl -X GET "https://your-uptimer-instance.com/api/v1/rules?workspace_id=ws_123456" \
  -H "Authorization: Bearer $UPTIMER_TOKEN"
```

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

### Update Rule

```bash
curl -X POST https://your-uptimer-instance.com/api/v1/rules/rule_123456 \
  -H "Authorization: Bearer $UPTIMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Rule",
    "interval": 120,
    "request": {
      "url": "https://example.com",
      "method": "GET"
    },
    "response": {
      "statuses": [200]
    }
  }'
```

```text
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Delete Rule

```bash
curl -X DELETE https://your-uptimer-instance.com/api/v1/rules/rule_123456 \
  -H "Authorization: Bearer $UPTIMER_TOKEN"
```

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Regions

```bash
curl -X GET https://your-uptimer-instance.com/api/v1/regions \
  -H "Authorization: Bearer $UPTIMER_TOKEN"
```

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

## Error Handling

### Validation Error

```json
{
  "result": null,
  "error": {
    "code": 2001,
    "error_type": "validation_error",
    "message": "Validation failed",
    "details": "Field 'name' is required"
  },
  "meta": null
}
```

### Access Denied

```json
{
  "result": null,
  "error": {
    "code": 2005,
    "error_type": "access_denied",
    "message": "Access denied",
    "details": "User does not have access to this workspace"
  },
  "meta": null
}
```
