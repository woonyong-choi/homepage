## Overview

Each Supabase project includes a Postgres database. Tables, SQL, extensions, backups, and database access policies are managed as part of the project.

### Example

Create a small table in the SQL Editor, then add an access policy before querying it from a client.

```sql
create table public.instruments (
  id bigint generated always as identity primary key,
  name text not null
);
```

## Build safely

Create tables for your data model and define Row Level Security policies before exposing data through client applications. Use migrations to track schema changes.

## Continue

See [Database Migrations](#/guides/migrations) and [Realtime](#/guides/realtime).

[Read the current official guide](https://supabase.com/docs/guides/database/overview).
