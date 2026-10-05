`on(type, filter, callback)`

Listen for presence events on this channel — when peers join, leave, or sync presence state.

- By default, Broadcast and Presence are enabled for all projects.

- By default, listening to database changes is disabled for new projects due to database performance and security concerns. You can turn it on by managing Realtime's [replication](https://supabase.com/docs/guides/api#realtime-api-overview).

- You can receive the "previous" data for updates and deletes by setting the table's `REPLICA IDENTITY` to `FULL` (e.g., `ALTER TABLE your_table REPLICA IDENTITY FULL;`).

- Row level security is not applied to delete statements. When RLS is enabled and replica identity is set to full, only the primary key is sent to clients.

## Parameters

- typeOne of the following options
- Option 1"presence"

- Option 2"postgres_changes"

- Option 3"broadcast"

- Option 4"system"

- filterOne of the following options
- Option 1object

- Option 2object

- Option 3object

- Option 4object

- Option 5RealtimePostgresChangesFilter

- Option 6RealtimePostgresChangesFilter

- Option 7RealtimePostgresChangesFilter

- Option 8RealtimePostgresChangesFilter

- Option 9RealtimePostgresChangesFilter

- Option 10object

- Option 11object

- Option 12object

- Option 13object

- Option 14object

- callbackfunction

```typescript
const channel = supabase.channel("room1")

channel.on("broadcast", { event: "cursor-pos" }, (payload) => {
  console.log("Cursor position received!", payload);
}).subscribe((status) => {
  if (status === "SUBSCRIBED") {
    channel.send({
      type: "broadcast",
      event: "cursor-pos",
      payload: { x: Math.random(), y: Math.random() },
    });
  }
});
```
