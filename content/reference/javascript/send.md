`send(args, opts)`

Sends a message into the channel.

- When using REST you don't need to subscribe to the channel

- REST calls are only available from 2.37.0 onwards

- If you create a channel only to send a REST broadcast, remove it from the client when the send completes

## Parameters

- argsobject

Arguments to send to channel

- opts{ [key: string]: any }

Options to be used during the send process

## Return Type

Promise<One of the following options>
- Option 1"ok"

- Option 2"timed out"

- Option 3"error"

- Option 4

```typescript
const channel = supabase.channel('room1')

channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    channel.send({
      type: 'broadcast',
      event: 'cursor-pos',
      payload: { x: Math.random(), y: Math.random() },
    })
  }
})
```
