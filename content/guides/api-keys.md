## Choose the right key

Use a publishable key in browser or mobile code. Requests made with that key still follow your database grants and Row Level Security policies. Use a secret key only in a trusted server environment.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

## Keep server credentials private

Read server credentials from the deployment environment. Do not send a secret key to a browser, bundle it into client code, or commit it to a repository.

```ts
const secretKey = process.env.SUPABASE_SECRET_KEY
if (!secretKey) throw new Error('SUPABASE_SECRET_KEY is required')
```

## Next steps

Continue with [Next.js](#/guides/getting-started/quickstarts/nextjs) or [migrate existing API keys](#/guides/migrating-to-new-api-keys).
