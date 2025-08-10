---
title: "Version"
weight: 101
---

# Version Endpoint

Get API version information.

## GET /version

Returns the current API version. This endpoint does not require authentication.

### Request

```text
GET /api/version
```

### Response

#### Success Response

**Status:** 200 OK

```json
{
  "result": "1.0.0",
  "error": null,
  "meta": null
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `result` | string | The current API version (e.g., "1.0.0") |
| `error` | null | Always null for successful responses |
| `meta` | null | Always null for this endpoint |

### Example

```bash
curl -X GET https://your-uptimer-instance.com/api/version
```

**Response:**

```json
{
  "result": "1.0.0",
  "error": null,
  "meta": null
}
```

### Notes

- This endpoint is **public** and does not require authentication
- The version string follows semantic versioning (e.g., "1.0.0")
- During development, the version may be "dev"
- The version can be overridden during build using build flags
