`overlaps(column, value)`

Only relevant for array and range columns. Match only rows where `column` and `value` have an element in common.

## Parameters

- columnOne of the following options

The array or range column to filter on

- Option 1ColumnName

- Option 2string

- valueOne of the following options

The array or range value to filter with

- Option 1string

- Option 2Array<Row['ColumnName']>

- Option 3Array<unknown>

## Return Type

this

```typescript
const { data, error } = await supabase
  .from('issues')
  .select('title')
  .overlaps('tags', ['is:closed', 'severity:high'])
```
