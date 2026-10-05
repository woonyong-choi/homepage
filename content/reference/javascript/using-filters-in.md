`in(column, values)`

Match only rows where `column` is included in the `values` array.

## Parameters

- columnColumnName

The column to filter on

- valuesArray

The values array to filter with

## Return Type

this

```typescript
const { data, error } = await supabase
  .from('characters')
  .select()
  .in('name', ['Leia', 'Han'])
```
