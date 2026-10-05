`neq(column, value)`

Match only rows where `column` is not equal to `value`.

This filter does not include rows where `column` is `NULL`. To match null values, use `.is(column, null)` instead.

## Parameters

- column

The column to filter on

- value

The value to filter with

## Return Type

this

```typescript
const { data, error } = await supabase
  .from('characters')
  .select()
  .neq('name', 'Leia')
```
