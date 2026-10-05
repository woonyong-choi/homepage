`rangeGt(column, range)`

Only relevant for range columns. Match only rows where every element in `column` is greater than any element in `range`.

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
  .rangeGt('during', '[2000-01-02 08:00, 2000-01-02 09:00)')
```
