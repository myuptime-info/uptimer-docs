---
title: "Workspaces"
weight: 102
---

# Workspaces Endpoints

Manage workspaces and permissions.

## GET /v1/workspaces

Returns user's workspaces.

### Request

```text
GET /api/v1/workspaces
Authorization: Bearer YOUR_JWT_TOKEN
```

### Response

#### Success Response

**Status:** 200 OK

```json
{
  "result": [
    {
      "id": "ws_123456",
      "name": "Production Monitoring",
      "role": "owner",
      "kind": "workspace"
    },
    {
      "id": "ws_789012",
      "name": "Development Environment",
      "role": "member",
      "kind": "workspace"
    }
  ],
  "error": null,
  "meta": null
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `result` | array | Array of workspace objects |
| `result[].id` | string | Unique workspace identifier |
| `result[].name` | string | Human-readable workspace name |
| `result[].role` | string | User's role in this workspace (`owner`, `member`) |
| `result[].kind` | string | Object type identifier (`workspace`) |
| `error` | null | Always null for successful responses |
| `meta` | null | Always null for this endpoint |

#### User Roles

| Role | Description |
|------|-------------|
| `owner` | Full access to workspace |
| `member` | Can manage rules within workspace |

### Error Responses

#### 1001 - Missing Authorization Header

```json
{
  "result": null,
  "error": {
    "code": 1001,
    "error_type": "access_denied",
    "message": "Missing Authorization header",
    "details": "Authorization header is required"
  },
  "meta": null
}
```

#### 1003 - Invalid Token

```json
{
  "result": null,
  "error": {
    "code": 1003,
    "error_type": "access_denied",
    "message": "Invalid token",
    "details": "The provided JWT token is invalid or expired"
  },
  "meta": null
}
```

### Example

```bash
curl -X GET https://your-uptimer-instance.com/api/v1/workspaces \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
  "result": [
    {
      "id": "ws_123456",
      "name": "Production Monitoring",
      "role": "owner",
      "kind": "workspace"
    }
  ],
  "error": null,
  "meta": null
}
```

### Notes

- Returns only workspaces where user has membership
- `role` field indicates user's permission level
- Workspaces are top-level organizational unit for rules
