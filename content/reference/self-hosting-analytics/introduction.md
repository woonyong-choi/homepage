## Overview

This reference covers the self-hosted Analytics component. Operating analytics service means keeping its configuration, dependencies, updates, and monitoring under your control.

### Example

Check container status and recent logs while bringing up the self-hosted stack.

```sh
docker compose ps
docker compose logs --tail=50
```

## Configure

Configure the analytics service and its dependencies, then confirm events flow from the services you operate. Keep secrets outside source control and make the service reachable only where needed.

## Verify

Start the component with the rest of the stack, make a small request, and inspect both its logs and dependent services. Document backup, recovery, and update steps before relying on the deployment.

## Continue

See [Self-host Supabase](#/guides/self-hosting) for the wider deployment picture.

[View the official Analytics documentation](https://supabase.com/docs/reference/self-hosting-analytics/introduction).
