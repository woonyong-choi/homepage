## Set up your project

Create a Supabase project and configure the application with a publishable key. Follow the [React quickstart](#/guides/getting-started/quickstarts/reactjs) for the initial connection.

## Create user profiles

Store profile data in a table protected by Row Level Security.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id),
  display_name text
);
alter table public.profiles enable row level security;
```

## Add authentication

Use [Auth](#/guides/auth) to sign users in, then query only the profile rows they are permitted to access.

## Upload an avatar

Use [Storage](#/guides/storage) for profile images and define an access policy before enabling uploads.
