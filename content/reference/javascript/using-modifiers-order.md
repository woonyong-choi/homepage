`order(column, options?)`

Order the query result by `column`.

You can call this method multiple times to order by multiple columns.

You can order referenced tables, but it only affects the ordering of the parent table if you use `!inner` in the query.

## Parameters

- columnOne of the following options

The column to order by

- Option 1ColumnName

- Option 2string

- optionsOptionalobject

Named parameters

## Return Type

this

```typescript
const { data, error } = await supabase
  .from('characters')
  .select('id, name')
  .order('id', { ascending: false })
```
