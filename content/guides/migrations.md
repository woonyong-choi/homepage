## Overview

Database migrations record schema changes as files. They make a project database reproducible and reviewable with application code.

### Example

Create a named migration file so schema changes can be reviewed and replayed.

```sh
npx supabase migration new create_instruments
```

## Workflow

Create a migration for a focused change, apply it locally, verify the result, and promote it through your normal review process.

## Continue

Review the [Database](#/guides/database) model and the [CLI reference](#/reference/cli).

[Read the current official guide](https://supabase.com/docs/guides/deployment/database-migrations).
