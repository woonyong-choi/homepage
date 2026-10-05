## Overview

Query project data through GraphQL. This guide introduces the area and the checks to make before using it in an application.

### Example

Start with a small GraphQL query before selecting project data.

```graphql
query {
  __typename
}
```

## Set up

Enable and inspect the GraphQL endpoint available for your project. Model the tables and relationships you want to query.

## Verify

Run a small query and confirm that database permissions and policies still control returned data.

## Related guides

See [Database](#/guides/database) for schema and access policies, and [Local Development](#/guides/local-development) for testing changes before deployment.

[View the official GraphQL API documentation](https://supabase.com/docs/guides/graphql).
