`limit(rows, options)`

Limit the query result by `rows`.

## Parameters

- rowsnumber

The maximum number of rows to return

- optionsobject

Named parameters

## Return Type

this

```typescript
const { data, error } = await supabase
  .from('characters')
  .select('name')
  .limit(1)
```
