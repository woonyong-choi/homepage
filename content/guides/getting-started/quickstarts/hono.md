## 1. Create a Supabase project

Create a project in the Supabase Dashboard. Copy the project URL and publishable key from the Connect panel. These values identify the project; never place a secret or service-role key in a public client.

### Example

Create a client in Hono application code and keep any service-role key in trusted server environment variables.

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(projectUrl, publishableKey)
```

## 2. Prepare Hono

Create a Hono application and keep privileged project keys only in server-side environment variables.

## 3. Connect the application

Add the project URL and publishable key to the application's environment configuration. Initialize one reusable Supabase client. Keep any privileged operation on a trusted server and apply Row Level Security to browser-accessible tables.

## 4. Read sample data

Create a small table in the SQL Editor, allow the intended role to read it with a policy, then query that table from Hono. Show loading, empty, and error states as well as the returned rows.

## Continue

Review [Database](#/guides/database), [Auth](#/guides/auth), and [Storage](#/guides/storage) when extending the application.

[View the official Hono documentation](https://supabase.com/docs/guides/getting-started/quickstarts/hono).
