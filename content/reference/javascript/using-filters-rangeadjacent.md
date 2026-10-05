`rangeAdjacent(column, range)`

Only relevant for range columns. Match only rows where `column` is mutually exclusive to `range` and there can be no element between the two ranges.

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
  .rangeAdjacent('during', '[2000-01-01 12:00, 2000-01-01 13:00)')
```
