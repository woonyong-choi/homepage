`rangeLte(column, range)`

Only relevant for range columns. Match only rows where every element in `column` is either contained in `range` or less than any element in `range`.

## Parameters

- columnOne of the following options

The range column to filter on

- Option 1ColumnName

- Option 2string

- rangestring

The range to filter with

## Return Type

this

```typescript
const { data, error } = await supabase
  .from('reservations')
  .select()
  .rangeLte('during', '[2000-01-01 14:00, 2000-01-01 16:00)')
```
