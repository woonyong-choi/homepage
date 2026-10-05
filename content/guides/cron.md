## Overview

Schedule repeatable database jobs. This guide introduces the area and the checks to make before using it in an application.

### Example

Inspect scheduled jobs after enabling the Cron extension.

```sql
select jobid, schedule, command
from cron.job
order by jobid;
```

## Set up

Define the work that must run on a schedule and keep each run safe to repeat. Use a database function or another supported target for the job.

## Verify

Check the schedule, execution history, and failure behavior before relying on the task.

## Related guides

See [Database](#/guides/database) for schema and access policies, and [Local Development](#/guides/local-development) for testing changes before deployment.

[View the official Cron documentation](https://supabase.com/docs/guides/cron).
