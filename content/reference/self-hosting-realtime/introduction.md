## Overview

This reference covers the self-hosted Realtime component. Operating realtime service means keeping its configuration, dependencies, updates, and monitoring under your control.

### Example

Check container status and recent logs while bringing up the self-hosted stack.

```sh
docker compose ps
docker compose logs --tail=50
```

## Configure

Connect Realtime to Postgres and configure the channels and replication settings used by clients. Keep secrets outside source control and make the service reachable only where needed.

## Verify

Start the component with the rest of the stack, make a small request, and inspect both its logs and dependent services. Document backup, recovery, and update steps before relying on the deployment.

## Continue

See [Self-host Supabase](#/guides/self-hosting) for the wider deployment picture.

[View the official Realtime documentation](https://supabase.com/docs/reference/self-hosting-realtime/introduction).
