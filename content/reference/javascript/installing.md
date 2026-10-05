## Install as package

You can install @supabase/supabase-js via the terminal.

```tabs
{"npm":"npm install @supabase/supabase-js","Yarn":"yarn add @supabase/supabase-js","pnpm":"pnpm add @supabase/supabase-js"}
```

## Install via CDN

You can install @supabase/supabase-js via CDN links.

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//or
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
```

## Use at runtime in Deno

You can use supabase-js in the Deno runtime via [JSR](https://jsr.io/@supabase/supabase-js):

```ts
import { createClient } from 'npm:@supabase/supabase-js@2'
```

## Enable Data API access

supabase-js uses the Data API to query and mutate your Postgres data. You first need to grant Data API roles permissions to access your tables and functions.

In [Data API integrations settings](https://supabase.com/dashboard/project/_/integrations/data_api/settings), expose the specific tables and functions you want to access. To automatically grant access for new tables and functions in `public`, enable **Default privileges for new entities**.

Alternatively, use SQL to grant the required permissions:

```sql
-- Before granting access to client roles, make sure RLS is enabled
-- and create the policies required for each role's allowed operations.
alter table public.your_table enable row level security;
-- create policy ... on public.your_table ...;

-- Grant least-privilege access to tables after RLS and policies are in place
grant select on public.your_table to anon;
grant select, insert, update, delete on public.your_table to authenticated;
grant all on public.your_table to service_role;

-- Grant execute on functions after verifying any table access they rely on
grant execute on function public.your_function to authenticated, service_role;
```
