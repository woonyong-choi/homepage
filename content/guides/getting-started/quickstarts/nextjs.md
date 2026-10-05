```prompt
Help me add Supabase to my Next.js project. Create a Supabase project at database.new and run the instruments table SQL. Then:

1. Run `npx create-next-app -e with-supabase` to scaffold the app.
2. Rename `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Add an instruments page that queries Supabase with the server client.
4. Start the development server and check the page in a browser.
```

## 1. Create a Supabase project

To start, you need a Supabase project.

Create a new Supabase project from [the Dashboard of any organization](https://supabase.com/dashboard/new/_) you belong to.

> [!NOTE]
> Want to create a project programmatically?  
> Use [the Management API](#/reference/api/introduction) or ask [the MCP server](#/guides/ai-tools) to create a new Supabase project.

## 2. Set up your database

When your Supabase project is up and running, create an `instruments` table with some sample data. Then set only the privileges each Postgres role needs, add [Row Level Security (RLS)](#/guides/database) for enhanced security for database data by default, and create an RLS policy to make the data in the table publicly readable.

Do these steps within your project's dashboard by copying and running the snippet in your project's [SQL Editor](https://supabase.com/dashboard/project/_/sql/new).

> [!NOTE]
> Save some steps by clicking here to prefill the SQL in the SQL Editor, and then clicking **Run**.

> [!NOTE]
> You can use [the Management API](#/reference/api/introduction) or ask [the MCP server](#/guides/ai-tools) to execute SQL queries.

```sql SQL_EDITOR
-- Create the table
create table instruments (
  id bigint primary key generated always as identity,
  name text not null
);

-- Insert sample data into the table
insert into instruments (name)
values
  ('violin'),
  ('viola'),
  ('cello');

-- Grant the privileges the role needs, which is read access
grant select on public.instruments to anon;

-- Enable row level security for the table
alter table instruments enable row level security;

-- Create a policy to allow the anon role to read from the instruments table
create policy "public can read instruments"
on public.instruments
for select to anon
using (true);
```

> [!NOTE]
> If you disabled the Data API during project setup, enable it in the [**Integrations > Data API**](https://supabase.com/dashboard/project/_/integrations/data_api/settings) section of the Dashboard and expose the specific tables or functions you want to access. To automatically grant access for new tables and functions in `public`, enable **Automatically expose new tables**.

## 3. Create a Next.js app

Use the `create-next-app` command and the `with-supabase` template, to create a Next.js app pre-configured with [Cookie-based Auth](#/guides/auth), [TypeScript](https://www.typescriptlang.org/), and [Tailwind CSS](https://tailwindcss.com/).

```bash
npx create-next-app@latest my-app -e with-supabase
```

## 4. Set up AI tooling (optional)

Supabase provides two ways to give AI tools context about your project: Agent Skills, which give your AI coding agent procedural knowledge, and the MCP server, which connects AI assistants to your Supabase project directly.

### Agent Skills

[Agent Skills](#/guides/ai-tools) is a curated set of instructions that give your AI agent procedural knowledge about working with Supabase.

Install them so your AI coding agent can produce more accurate, reliable code using current Supabase patterns, such as authentication, server-side rendering, and database migrations, rather than relying solely on training data.

#### Installing Agent Skills

To install, run the following command in the root of your project:

```bash
npx skills add supabase/agent-skills
```

### Supabase MCP server

The Supabase MCP server connects AI assistants to Supabase, so they can inspect your schema and act on your projects on your behalf. Find out how to add it to your client in [the MCP docs](#/guides/ai-tools).

## 5. Declare Supabase environment variables

Rename `.env.example` to `.env.local` and populate with your Supabase connection variables that you can get from the helper below, or [from the project **Connect** panel](https://supabase.com/dashboard/project/_?showConnect=true\&framework=nextjs\&connectTab=frameworks).

[Open Connect panel](https://supabase.com/dashboard/project/_?showConnect=true)

```text name=.env.local
NEXT_PUBLIC_SUPABASE_URL=<SUBSTITUTE_SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<SUBSTITUTE_SUPABASE_PUBLISHABLE_KEY>
```

### Get API details

To interact with data in database tables, you use the client libraries that wrap [the auto-generated Data API endpoints](#/guides/api), authenticating using the Project URL and key from [the project **Connect** dialog](https://supabase.com/dashboard/project/_?showConnect=true\&connectTab=frameworks\&framework=nextjs).





```api-details
{}
```

> [!NOTE]
> See [API keys](#/guides/api-keys) for a full explanation of all key types, their uses, and where to find them.

## 6. Allow public access to the instruments page

The `with-supabase` template redirects unauthenticated visitors to the sign-in page for most routes. The `instruments` table is publicly readable, so update `lib/supabase/proxy.ts` to skip that redirect for `/instruments`.

Find this `if` statement:

```ts name=lib/supabase/proxy.ts
  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
```

Add a condition for `/instruments`:

```ts name=lib/supabase/proxy.ts
  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    request.nextUrl.pathname !== "/instruments" &&
    !request.nextUrl.pathname.startsWith("/instruments/")
  ) {
```

## 7. Query Supabase data from Next.js

The `with-supabase` template already installs `@supabase/supabase-js` and `@supabase/ssr` and creates the clients for you, in `lib/supabase/client.ts` for the browser and `lib/supabase/server.ts` for Server Components. The code below imports the server client from there.

Create a new file at `app/instruments/page.tsx` and populate with the following.

This selects all the rows from the `instruments` table you created earlier and renders them on the page.

```ts name=app/instruments/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

async function InstrumentsData() {
  const supabase = await createClient();
  const { data: instruments, error } = await supabase.from("instruments").select();

  if (error) {
    return <p>Error loading instruments: {error.message}</p>;
  }

  return <pre>{JSON.stringify(instruments, null, 2)}</pre>;
}

export default function Instruments() {
  return (
    <Suspense fallback={<div>Loading instruments...</div>}>
      <InstrumentsData />
    </Suspense>
  );
}
```

## 8. Start the app

Run the development server, go to [http://localhost:3000/instruments](http://localhost:3000/instruments) in a browser and you should see the list of instruments.

```bash
npm run dev
```

## Production requirements

The quickstart procedure in this guide optimizes for getting you to a working app, not for production.

Before you deploy:

- If your app reads or writes through the Data API, review your [Row Level Security](#/guides/database) policies. Any policy you added here is scoped to this quickstart's sample data, not to real user data.
- Set your Supabase credentials as environment variables on whatever platform you deploy to, rather than committing them to source control.
- Configure a [custom domain](#/guides/platform) for your Supabase project once you're ready to go live.

## Next steps

- Set up [Auth](#/guides/auth) for your app
- [Insert more data](#/guides/database) into your database
- Upload and serve static files using [Storage](#/guides/storage)
- Explore [drop-in UI components](https://supabase.com/ui) for your Supabase app
