---
title: "SDKs & Libraries"
weight: 110
---

# SDKs & Libraries

Official and community SDKs for interacting with the Uptimer API.

## Python SDK

The official Python SDK provides a convenient way to interact with the Uptimer API from Python applications.

### Installation

```bash
pip install uptimer-python-sdk
```

Or using `uv`:

```bash
uv add uptimer-python-sdk
```

### Quick Start

```python
from uptimer.client import UptimerClient
from uptimer.models.rule import CreateRuleRequest, RuleRequest, RuleResponse, RuleResponseBody

# Initialize the client
client = UptimerClient(
    api_key="your-api-key-here",
    base_url="http://127.0.0.1:2517/api",  # or your custom base URL
)

# Get available regions and workspaces
regions = client.v1.regions.all()
workspaces = client.v1.workspaces.all()
workspace_id = workspaces[0].id

# List existing rules
rules = client.v1.rules.all(workspace_id)

# Create a new monitoring rule
new_rule = client.v1.rules.create(
    CreateRuleRequest(
        name="My Test Rule",
        interval=60,  # Check every 60 seconds
        workspace_id=workspace_id,
        request=RuleRequest(
            url="https://example.com",
            method="GET",
            content_type="application/json",
            data="",  # data (substring) that should be contained in response
        ),
        response=RuleResponse(
            statuses=[200, 201, 202],  # any of these statuses means site is up
            body=RuleResponseBody(content="expected response"),
        ),
    ),
)

# Update an existing rule
updated_rule = client.v1.rules.update(
    new_rule.id,
    CreateRuleRequest(
        name="Updated Rule Name",
        interval=120,  # Change to 2 minutes
        workspace_id=workspace_id,
        request=RuleRequest(
            url="https://updated-example.com",
            method="POST",
            content_type="application/json",
            data='{"key": "value"}',
        ),
        response=RuleResponse(
            statuses=[200, 201],
            body=RuleResponseBody(content="updated expected response"),
        ),
    ),
)

# Delete a rule
try:
    client.v1.rules.delete(updated_rule.id)
except DefaultUptimerApiError as e:
    # Handle API errors
    print(f"Error: {e.message} (Code: {e.code})")
except UptimerInvalidHttpCodeError as e:
    # Handle HTTP transport errors
    print(f"HTTP Error: {e.status_code} for {e.url}")
```

### Error Handling

The SDK provides comprehensive error handling:

```python
from uptimer.errors import DefaultUptimerApiError, UptimerInvalidHttpCodeError, UptimerError

try:
    client.v1.rules.delete(rule_id)
except DefaultUptimerApiError as e:
    # API errors from uptimer server
    print(f"Message: {e.message}")      # User-friendly message
    print(f"Code: {e.code}")            # Error ID
    print(f"Type: {e.error_type}")      # Error class
    print(f"Details: {e.details}")      # Detailed developer message
except UptimerInvalidHttpCodeError as e:
    # HTTP transport errors (uptimer API always returns 200)
    print(f"URL: {e.url}")
    print(f"Status: {e.status_code}")
except UptimerError as e:
    # Base error class
    raise
```

### Resources

- **GitHub Repository**: [myuptime-info/uptimer-python-sdk](https://github.com/myuptime-info/uptimer-python-sdk)
- **PyPI Package**: [uptimer-python-sdk](https://pypi.org/project/uptimer-python-sdk/)
- **License**: MIT License

---

## Contributing SDKs

If you've created an SDK for another programming language, we'd love to feature it here! Please [open an issue](https://github.com/myuptime-info/uptimer-docs/issues) or submit a pull request to add your SDK to this documentation.
