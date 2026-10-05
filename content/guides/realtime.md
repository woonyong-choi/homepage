## Overview

Realtime lets clients subscribe to database changes, broadcast messages, and share presence state.

### Example

Subscribe to a channel and remove it when the view no longer needs live events.

```js
const channel = supabase.channel('room-1')
  .on('broadcast', { event: 'message' }, ({ payload }) => {
    console.log(payload)
  })
  .subscribe()
```

## Choose a channel

Select the event source your feature needs, then manage subscriptions when views mount and unmount. Review access policies for private data.

## Continue

Start with the [Database](#/guides/database) model and read the current Realtime guide for channel APIs.

[Read the current official guide](https://supabase.com/docs/guides/realtime).
