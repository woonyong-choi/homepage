## Overview

Manage projects and organizations through an API.

### Example

Use a server-side access token for Management API requests; never expose it in a browser bundle.

```sh
curl "https://api.supabase.com/v1/projects" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

## Explore

Create an access token with suitable scope and keep it on the server. Make requests against the management endpoint for the project or organization operation you need.

## Apply

Check response status, pagination, and error cases. Never embed management credentials in a public app.

## Continue

Return to the [documentation home](#/) or browse [Getting Started](#/guides/getting-started).

[View the official Management API documentation](https://supabase.com/docs/reference/api/introduction).
