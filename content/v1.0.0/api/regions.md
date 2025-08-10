---
title: "Regions"
weight: 104
---

# Regions Endpoints

Get available monitoring regions.

## GET /v1/regions

Returns available regions with worker counts.

### Request

```text
GET /api/v1/regions
Authorization: Bearer YOUR_JWT_TOKEN
```

### Response

#### Success Response

**Status:** 200 OK

```json
{
  "result": [
    {
      "id": "us-east-1",
      "name": "us-east-1",
      "active_workers_count": 5,
      "kind": "region"
    },
    {
      "id": "eu-west-1",
      "name": "eu-west-1",
      "display_name": "EU West (Ireland)",
      "active_workers_count": 3,
      "kind": "region"
    }
  ],
  "error": null,
  "meta": null
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `result` | array | Array of region objects |
| `result[].id` | string | Unique region identifier |
| `result[].name` | string | Region name (e.g., "us-east-1") |
| `result[].active_workers_count` | integer | Number of active workers in this region |
| `result[].kind` | string | Object type identifier (`region`) |

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
curl -X GET https://your-uptimer-instance.com/api/v1/regions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
  "result": [
    {
      "id": "us-east-1",
      "name": "us-east-1",
      "active_workers_count": 5,
      "kind": "region"
    },
    {
      "id": "eu-west-1",
      "name": "eu-west-1",
      "active_workers_count": 3,
      "kind": "region"
    },
    {
      "id": "ap-southeast-1",
      "name": "ap-southeast-1",
      "active_workers_count": 2,
      "kind": "region"
    }
  ],
  "error": null,
  "meta": null
}
```

## Notes

- Regions represent geographical worker locations
- `active_workers_count` shows running workers per region
- Rules auto-distribute across available workers
- Multiple regions provide redundancy
