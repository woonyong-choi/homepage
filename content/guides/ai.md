## Overview

Store embeddings alongside relational data and use vector similarity queries. This guide introduces the area and the checks to make before using it in an application.

### Example

Enable pgvector before defining embedding columns and similarity queries.

```sql
create extension if not exists vector;
```

## Set up

Start with a Postgres table for documents and embeddings. Decide how embeddings are generated and updated. Apply access policies to both the source content and search results.

## Verify

Test retrieval quality with representative queries, and inspect indexes as the table grows.

## Related guides

See [Database](#/guides/database) for schema and access policies, and [Local Development](#/guides/local-development) for testing changes before deployment.

[View the official AI & Vectors documentation](https://supabase.com/docs/guides/ai).
