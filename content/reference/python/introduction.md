## Introduction

The Python client lets an application call Supabase services using its project URL and publishable key. Select the package and initialization method documented for the SDK version you use.

### Example

Initialize the Python client, then query a table allowed by its access policy.

```python
from supabase import create_client

supabase = create_client(project_url, publishable_key)
rows = supabase.table('instruments').select('*').execute()
```

## Install and initialize

Use **supabase** for Python. Create a Python client with the project URL and an appropriate key in application configuration. Keep secret keys on trusted servers only.

## Make a first request

Create a table with an appropriate read policy, then query it through the client. Handle errors and empty results explicitly. Authentication, Storage, and Realtime operations use the same project configuration.

## Continue

Start with [Database](#/guides/database) and [Auth](#/guides/auth), then consult the official reference for complete method signatures.

[View the official Python documentation](https://supabase.com/docs/reference/python/introduction).
