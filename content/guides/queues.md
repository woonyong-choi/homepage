## Overview

Process work asynchronously with durable messages. This guide introduces the area and the checks to make before using it in an application.

### Example

Inspect available queues after enabling the Queues extension.

```sql
select * from pgmq.list_queues();
```

## Set up

Create a queue for background work, then have a worker read, process, and acknowledge messages. Keep a plan for retries and failed work.

## Verify

Verify that duplicate delivery does not corrupt application state.

## Related guides

See [Database](#/guides/database) for schema and access policies, and [Local Development](#/guides/local-development) for testing changes before deployment.

[View the official Queues documentation](https://supabase.com/docs/guides/queues).
