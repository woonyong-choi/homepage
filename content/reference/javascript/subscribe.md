`subscribe(callback?, timeout)`

Subscribe registers your client with the server.

The optional `callback` receives a `status` and, on failure, an `err` argument. Log the full `err` so its `cause`, `name`, and any structured fields aren't hidden behind `err.message`.

## Parameters

- callbackOptionalfunction

- timeoutnumber

```typescript
supabase.channel('room1').subscribe((status, err) => {
  if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
    // Log the full error: its `cause` often holds the underlying reason.
    console.error(status, err)
  }
})
```
