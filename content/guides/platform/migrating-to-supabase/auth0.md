## Plan the migration

This path moves user accounts from Auth0 to Supabase. Record data volume, dependencies, credentials, and a rollback point before changing the application.

### Example

Compare the imported user count with the export and test sign-in methods separately.

```sql
select count(*) from auth.users;
```

## Transfer the data

Plan how identities, password handling, and provider IDs map to Supabase Auth before moving users. Do a trial transfer into a separate project before scheduling the final cutover.

## Validate and switch

Compare row or object counts, sample important records, and test application reads and writes. Recreate access rules with Supabase policies where needed. Update the application's connection or project configuration only after validation.

## Related guides

See [Database Migrations](#/guides/migrations) and [Troubleshooting](#/guides/troubleshooting).

[View the official Auth0 documentation](https://supabase.com/docs/guides/platform/migrating-to-supabase/auth0).
