## Inventory your existing keys

Find applications that use legacy `anon` or `service_role` keys. Identify whether each consumer runs in a public client or a trusted server before changing its configuration.

## Replace client configuration

Use the project's publishable key in browser and mobile clients. Keep Row Level Security policies enabled for data reached through public clients.

```dotenv
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

## Replace server configuration

Use a secret key only in trusted server code. Rotate and remove old credentials after the new deployment is confirmed.

```dotenv
SUPABASE_SECRET_KEY=YOUR_SECRET_KEY
```

## Next steps

Review [API Keys](#/guides/api-keys) and then test each application path that reads or writes project data.
