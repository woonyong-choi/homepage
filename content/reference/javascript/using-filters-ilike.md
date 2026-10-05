`ilike(column, pattern)`

Match only rows where `column` matches `pattern` case-insensitively.

## Parameters

- columnOne of the following options

The column to filter on

- Option 1ColumnName

- Option 2string

- patternstring

The pattern to match with

## Return Type

this

```typescript
const { data, error } = await supabase
  .from('characters')
  .select()
  .ilike('name', '%lu%')
```
