`abortSignal(signal)`

Set the AbortSignal for the fetch request.

You can use this to set a timeout for the request.

## Parameters

- signalAbortSignal

The AbortSignal to use for the fetch request

## Return Type

this

```typescript
const ac = new AbortController()

const { data, error } = await supabase
  .from('very_big_table')
  .select()
  .abortSignal(ac.signal)

// Abort the request after 100 ms
setTimeout(() => ac.abort(), 100)
```
