## Overview

Access exposed Postgres data over HTTP. This guide introduces the area and the checks to make before using it in an application.

### Example

This example reads an exposed table; define an appropriate Row Level Security policy first.

```sh
curl "$SUPABASE_URL/rest/v1/instruments?select=*" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY"
```

## Set up

Select tables or functions to expose through the Data API. Grant only the needed privileges and define Row Level Security policies.

## Verify

Make a request with the appropriate project URL and key, then verify that unauthorized rows stay hidden.

## Related guides

See [Database](#/guides/database) for schema and access policies, and [Local Development](#/guides/local-development) for testing changes before deployment.

[View the official Data REST API documentation](https://supabase.com/docs/guides/api).
