## 1. Create a Supabase project

Create a project in the Supabase Dashboard. Copy the project URL and publishable key from the Connect panel. These values identify the project; never place a secret or service-role key in a public client.

## 2. Prepare TanStack Start

Create a TanStack Start application and keep server-only credentials in server code.

```sh
npm install @supabase/supabase-js
```

## 3. Connect the application

Add the project URL and publishable key to the application's environment configuration. Initialize one reusable Supabase client. Keep any privileged operation on a trusted server and apply Row Level Security to browser-accessible tables.

## 4. Read sample data

Create a small table in the SQL Editor, allow the intended role to read it with a policy, then query that table from TanStack Start. Show loading, empty, and error states as well as the returned rows.

## Continue

Review [Database](#/guides/database), [Auth](#/guides/auth), and [Storage](#/guides/storage) when extending the application.

[View the official TanStack Start documentation](https://supabase.com/docs/guides/getting-started/quickstarts/tanstack).
