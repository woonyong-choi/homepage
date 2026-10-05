`contains(column, value)`

Only relevant for jsonb, array, and range columns. Match only rows where `column` contains every element appearing in `value`.

## Parameters

- columnOne of the following options

The jsonb, array, or range column to filter on

- Option 1ColumnName

- Option 2string

- valueOne of the following options

The jsonb, array, or range value to filter with

- Option 1string

- Option 2Record<string, unknown>

- Option 3Array<Row['ColumnName']>

- Option 4Array<unknown>

## Return Type

this

```typescript
const { data, error } = await supabase
  .from('issues')
  .select()
  .contains('tags', ['is:open', 'priority:low'])
```
