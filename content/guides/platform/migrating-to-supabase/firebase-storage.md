## Plan the migration

This path moves objects and file metadata from Firebase Storage to Supabase. Record data volume, dependencies, credentials, and a rollback point before changing the application.

### Example

Compare object counts per bucket after the file transfer.

```sql
select bucket_id, count(*)
from storage.objects
group by bucket_id;
```

## Transfer the data

Inventory buckets and object paths, transfer files, then rebuild access rules with Storage policies. Do a trial transfer into a separate project before scheduling the final cutover.

## Validate and switch

Compare row or object counts, sample important records, and test application reads and writes. Recreate access rules with Supabase policies where needed. Update the application's connection or project configuration only after validation.

## Related guides

See [Database Migrations](#/guides/migrations) and [Troubleshooting](#/guides/troubleshooting).

[View the official Firebase Storage documentation](https://supabase.com/docs/guides/platform/migrating-to-supabase/firebase-storage).
