## Plan the migration

This path moves user accounts from Firebase Auth to Supabase. Record data volume, dependencies, credentials, and a rollback point before changing the application.

### Example

Compare the imported user count with the export and test sign-in methods separately.

```sql
select count(*) from auth.users;
```

## Transfer the data

Export users through the supported Firebase flow and map their identifiers and authentication methods to Supabase Auth. Do a trial transfer into a separate project before scheduling the final cutover.

## Validate and switch

Compare row or object counts, sample important records, and test application reads and writes. Recreate access rules with Supabase policies where needed. Update the application's connection or project configuration only after validation.

## Related guides

See [Database Migrations](#/guides/migrations) and [Troubleshooting](#/guides/troubleshooting).

[View the official Firebase Auth documentation](https://supabase.com/docs/guides/platform/migrating-to-supabase/firebase-auth).
