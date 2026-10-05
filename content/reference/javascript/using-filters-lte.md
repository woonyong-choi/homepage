`lte(column, value)`

Match only rows where `column` is less than or equal to `value`.

## Parameters

- columnOne of the following options

The column to filter on

- Option 1ColumnName

- Option 2string

- valueOne of the following options

The value to filter with

- Option 1Row['ColumnName']

- Option 2unknown

## Return Type

this

```typescript
const { data, error } = await supabase
  .from('characters')
  .select()
  .lte('id', 2)
```
