`range(from, to, options)`

Limit the query result by starting at an offset `from` and ending at the offset `to`. Only records within this range are returned. This respects the query order and if there is no order clause the range could behave unexpectedly. The `from` and `to` values are 0-based and inclusive: `range(1, 3)` will include the second, third and fourth rows of the query.

## Parameters

- fromnumber

The starting index from which to limit the result

- tonumber

The last index to which to limit the result

- optionsobject

Named parameters

## Return Type

this

```typescript
const { data, error } = await supabase
  .from('characters')
  .select('name')
  .range(0, 1)
```
