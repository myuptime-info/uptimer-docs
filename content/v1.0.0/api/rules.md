---
title: "Rules"
weight: 103
---

# Rules Endpoints

Manage monitoring rules within workspaces.

## GET /v1/rules

Get all rules for workspace.

### Request

```text
GET /api/v1/rules?workspace_id=ws_123456
Authorization: Bearer YOUR_JWT_TOKEN
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspace_id` | string | Yes | The workspace UID |

### Response

#### Success Response

**Status:** 200 OK

```json
{
  "result": [
    {
      "id": "rule_123456",
      "name": "Website Health Check",
      "interval": 300,
      "workspace_id": "ws_123456",
      "request": {
        "url": "https://example.com",
        "method": "GET",
        "content_type": "",
        "data": "",
        "kind": "rule_request"
      },
      "response": {
        "statuses": [200],
        "body": {
          "content": "",
          "kind": "rule_response_body"
        },
        "kind": "rule_response"
      },
      "kind": "rule"
    }
  ],
  "error": null,
  "meta": null
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `result` | array | Array of rule objects |
| `result[].id` | string | Unique rule identifier |
| `result[].name` | string | Human-readable rule name |
| `result[].interval` | integer | Check interval in seconds |
| `result[].workspace_id` | string | Workspace UID this rule belongs to |
| `result[].request` | object | HTTP request configuration |
| `result[].request.url` | string | Target URL to monitor |
| `result[].request.method` | string | HTTP method (`GET`, `POST`, `PUT`, etc.) |
| `result[].request.content_type` | string | Content-Type header (optional) |
| `result[].request.data` | string | Request body data (optional) |
| `result[].response` | object | Expected response configuration |
| `result[].response.statuses` | array | Expected HTTP status codes |
| `result[].response.body.content` | string | Expected response body content (optional) |
| `result[].kind` | string | Object type identifier (`rule`) |

### Error Responses

#### 2004 - Missing Workspace ID

```json
{
  "result": null,
  "error": {
    "code": 2004,
    "error_type": "validation_error",
    "message": "Missing workspace ID",
    "details": "workspace_id query parameter is required"
  },
  "meta": null
}
```

#### 2005 - Access Denied

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

## GET /v1/rules/{uid}

Get rule by UID.

### Request

```text
GET /api/v1/rules/rule_123456
Authorization: Bearer YOUR_JWT_TOKEN
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uid` | string | Yes | The rule UID |

### Response

#### Success Response

**Status:** 200 OK

```json
{
  "result": {
    "id": "rule_123456",
    "name": "Website Health Check",
    "interval": 300,
    "workspace_id": "ws_123456",
    "request": {
      "url": "https://example.com",
      "method": "GET",
      "content_type": "",
      "data": "",
      "kind": "rule_request"
    },
    "response": {
      "statuses": [200],
      "body": {
        "content": "",
        "kind": "rule_response_body"
      },
      "kind": "rule_response"
    },
    "kind": "rule"
  },
  "error": null,
  "meta": null
}
```

### Error Responses

#### 2002 - Rule Not Found

```json
{
  "result": null,
  "error": {
    "code": 2002,
    "error_type": "not_found",
    "message": "Rule not found",
    "details": "Rule does not exist or access denied"
  },
  "meta": null
}
```

## POST /v1/rules

Create new rule.

### Request

```text
POST /api/v1/rules
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Request Body

```json
{
  "name": "Website Health Check",
  "interval": 300,
  "workspace_id": "ws_123456",
  "request": {
    "url": "https://example.com",
    "method": "GET",
    "content_type": "",
    "data": ""
  },
  "response": {
    "statuses": [200],
    "body": {
      "content": ""
    }
  }
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Human-readable rule name (1-100 characters) |
| `interval` | integer | Yes | Check interval in seconds (60-86400) |
| `workspace_id` | string | Yes | Workspace UID this rule belongs to |
| `request` | object | Yes | HTTP request configuration |
| `request.url` | string | Yes | Target URL to monitor (must be valid URL) |
| `request.method` | string | Yes | HTTP method (`GET`, `POST`, `PUT`, `DELETE`, `HEAD`, `OPTIONS`) |
| `request.content_type` | string | No | Content-Type header |
| `request.data` | string | No | Request body data |
| `response` | object | Yes | Expected response configuration |
| `response.statuses` | array | Yes | Expected HTTP status codes (1-10 status codes) |
| `response.body.content` | string | No | Expected response body content |

### Response

#### Success Response

**Status:** 200 OK

```json
{
  "result": {
    "id": "rule_123456",
    "name": "Website Health Check",
    "interval": 300,
    "workspace_id": "ws_123456",
    "request": {
      "url": "https://example.com",
      "method": "GET",
      "content_type": "",
      "data": "",
      "kind": "rule_request"
    },
    "response": {
      "statuses": [200],
      "body": {
        "content": "",
        "kind": "rule_response_body"
      },
      "kind": "rule_response"
    },
    "kind": "rule"
  },
  "error": null,
  "meta": null
}
```

### Error Responses

#### 2001 - Validation Error

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

#### 2005 - Access Denied

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

## POST /v1/rules/{uid}

Update rule.

### Request

```text
POST /api/v1/rules/rule_123456
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uid` | string | Yes | The rule UID |

### Request Body

```json
{
  "name": "Updated Website Health Check",
  "interval": 600,
  "request": {
    "url": "https://example.com/health",
    "method": "GET",
    "content_type": "",
    "data": ""
  },
  "response": {
    "statuses": [200, 201],
    "body": {
      "content": "healthy"
    }
  }
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Human-readable rule name (1-100 characters) |
| `interval` | integer | Yes | Check interval in seconds (60-86400) |
| `request` | object | Yes | HTTP request configuration |
| `request.url` | string | Yes | Target URL to monitor (must be valid URL) |
| `request.method` | string | Yes | HTTP method (`GET`, `POST`, `PUT`, `DELETE`, `HEAD`, `OPTIONS`) |
| `request.content_type` | string | No | Content-Type header |
| `request.data` | string | No | Request body data |
| `response` | object | Yes | Expected response configuration |
| `response.statuses` | array | Yes | Expected HTTP status codes (1-10 status codes) |
| `response.body.content` | string | No | Expected response body content |

### Response

#### Success Response

**Status:** 200 OK

```json
{
  "result": {
    "id": "rule_123456",
    "name": "Updated Website Health Check",
    "interval": 600,
    "workspace_id": "ws_123456",
    "request": {
      "url": "https://example.com/health",
      "method": "GET",
      "content_type": "",
      "data": "",
      "kind": "rule_request"
    },
    "response": {
      "statuses": [200, 201],
      "body": {
        "content": "healthy",
        "kind": "rule_response_body"
      },
      "kind": "rule_response"
    },
    "kind": "rule"
  },
  "error": null,
  "meta": null
}
```

## DELETE /v1/rules/{uid}

Delete rule.

### Request

```text
DELETE /api/v1/rules/rule_123456
Authorization: Bearer YOUR_JWT_TOKEN
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uid` | string | Yes | The rule UID |

### Response

#### Success Response

**Status:** 200 OK

```json
{
  "result": null,
  "error": null,
  "meta": null
}
```

### Error Responses

#### 2002 - Rule Not Found

```json
{
  "result": null,
  "error": {
    "code": 2002,
    "error_type": "not_found",
    "message": "Rule not found",
    "details": "Rule does not exist or access denied"
  },
  "meta": null
}
```



## Validation Rules

### Name
- Required, 1-100 characters

### Interval
- Required, 60-86400 seconds

### URL
- Required, valid HTTP/HTTPS URL

### Method
- Required: `GET`, `POST`, `PUT`, `DELETE`, `HEAD`, `OPTIONS`

### Status Codes
- Required, 1-10 codes, 100-599 range

### Content Type
- Optional, valid MIME type

## Notes

- Rules are workspace-specific
- `interval` determines check frequency
- Response body validation is optional
- Rules auto-assign to available workers
