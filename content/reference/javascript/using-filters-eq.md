`eq(column, value)`

Match only rows where `column` is equal to `value`.

To check if the value of `column` is NULL, you should use `.is()` instead.

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
  .eq('name', 'Leia')
```
