`rpc(fn, args, options)`

Perform a function call.

## Parameters

- fnFnName

The function name to call

- argsArgs

The arguments to pass to the function call

- optionsobject

Named parameters

```typescript
// For cross-schema functions where type inference fails, use overrideTypes:
const { data } = await supabase
  .schema('schema_b')
  .rpc('function_a', {})
  .overrideTypes<{ id: string; user_id: string }[]>()
```
