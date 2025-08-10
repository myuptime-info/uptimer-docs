---
title: "API Reference"
weight: 100
---

# Uptimer API Reference

RESTful API for uptime monitoring. Manage workspaces, rules, and regions.

## Base URL

```
https://your-uptimer-instance.com/api
```

## Key Features

- **HTTP response code always 200** - If not 200, it's a HTTP communication problem or invalid URL
- **Persistent response format** - Consistent JSON structure across all endpoints
- **Object identifier for deserialization** - All objects include a `kind` field for easy client-side handling

## Authentication

Include JWT token in Authorization header.

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

## Response Format

All responses return HTTP 200. Other status codes indicate HTTP communication problems.

### Success Response

```json
{
  "result": {
    // Response data here
  },
  "error": null,
  "meta": {
    // Optional metadata
  }
}
```

### Error Response

```json
{
  "result": null,
  "error": {
    "code": 2001,
    "error_type": "validation_error",
    "message": "Invalid input",
    "details": "Field 'name' is required"
  },
  "meta": null
}
```

## Error Handling

All endpoints return HTTP 200, even for errors.

### Error Types

| Error Type | Description | Code Range |
|------------|-------------|------------|
| `access_denied` | Authentication/authorization errors | 1001-1999 |
| `validation_error` | Input validation errors | 2001 |
| `not_found` | Resource not found | 2002 |
| `forbidden` | Permission denied | 2003 |
| `internal_error` | Server errors | 500 |

### Common Error Codes

- **1001** - Missing Authorization header
- **1002** - Invalid Authorization header format
- **1003** - Invalid token
- **2001** - Validation error
- **2002** - Resource not found
- **2005** - Access denied

## Object Kind Identification

All objects include a `kind` field for client identification:

```json
{
  "id": "rule_123456",
  "name": "Website Health Check",
  "kind": "rule"
}
```

## Available Endpoints

- [Version](/v1.0.0/api/version/) - Get API version information
- [Workspaces](/v1.0.0/api/workspaces/) - Manage workspaces and view workspace information
- [Rules](/v1.0.0/api/rules/) - Manage monitoring rules within workspaces
- [Regions](/v1.0.0/api/regions/) - Get information about available monitoring regions
- [Examples](/v1.0.0/api/examples/) - Practical API usage examples and best practices
