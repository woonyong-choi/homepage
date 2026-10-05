`retry(enabled)`

## Parameters

- enabledboolean

Whether to enable retries for this request

## Return Type

this

```typescript
// Disable retries for a specific query
const { data, error } = await supabase
  .from('users')
  .select()
  .retry(false)
```
