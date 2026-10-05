## Plan the migration

This path moves document data from Firestore Data to Supabase. Record data volume, dependencies, credentials, and a rollback point before changing the application.

### Example

Inspect the target tables created for the imported document collections.

```sql
select table_name
from information_schema.tables
where table_schema = 'public';
```

## Transfer the data

Model Firestore collections as Postgres tables or JSON fields, then transform and import documents. Do a trial transfer into a separate project before scheduling the final cutover.

## Validate and switch

Compare row or object counts, sample important records, and test application reads and writes. Recreate access rules with Supabase policies where needed. Update the application's connection or project configuration only after validation.

## Related guides

See [Database Migrations](#/guides/migrations) and [Troubleshooting](#/guides/troubleshooting).

[View the official Firestore Data documentation](https://supabase.com/docs/guides/platform/migrating-to-supabase/firestore-data).
