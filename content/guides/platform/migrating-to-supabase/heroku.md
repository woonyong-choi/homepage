## Plan the migration

This path moves Postgres database from Heroku to Supabase. Record data volume, dependencies, credentials, and a rollback point before changing the application.

### Example

After setting the destination connection URL, list imported tables and compare them with the source inventory.

```sh
psql "$SUPABASE_DB_URL" -c "\dt"
```

## Transfer the data

Back up the Heroku Postgres database, inspect roles and extensions, then restore schema and data into Supabase. Do a trial transfer into a separate project before scheduling the final cutover.

## Validate and switch

Compare row or object counts, sample important records, and test application reads and writes. Recreate access rules with Supabase policies where needed. Update the application's connection or project configuration only after validation.

## Related guides

See [Database Migrations](#/guides/migrations) and [Troubleshooting](#/guides/troubleshooting).

[View the official Heroku documentation](https://supabase.com/docs/guides/platform/migrating-to-supabase/heroku).
