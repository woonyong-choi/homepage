## Overview

This reference covers the self-hosted Storage component. Operating object storage service means keeping its configuration, dependencies, updates, and monitoring under your control.

### Example

Check container status and recent logs while bringing up the self-hosted stack.

```sh
docker compose ps
docker compose logs --tail=50
```

## Configure

Choose an object store, configure the Storage service and database connection, then define bucket policies. Keep secrets outside source control and make the service reachable only where needed.

## Verify

Start the component with the rest of the stack, make a small request, and inspect both its logs and dependent services. Document backup, recovery, and update steps before relying on the deployment.

## Continue

See [Self-host Supabase](#/guides/self-hosting) for the wider deployment picture.

[View the official Storage documentation](https://supabase.com/docs/reference/self-hosting-storage/introduction).
