## Build on Postgres

A Supabase project starts with a Postgres database. The Data API exposes configured schemas, while grants and Row Level Security determine who can access each table.

```sql
create table public.notes (
  id bigint generated always as identity primary key,
  body text not null
);
alter table public.notes enable row level security;
```

## Add application services

Auth identifies callers, Storage manages files, Realtime streams changes, and Edge Functions run server-side code. Applications can use these services together while keeping authorization rules close to their data.

## Next steps

Explore [Database](#/guides/database), [Auth](#/guides/auth), and [Storage](#/guides/storage).
