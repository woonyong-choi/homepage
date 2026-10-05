`delete(options)`

Perform a DELETE on the table or view.

By default, deleted rows are not returned. To return it, chain the call with `.select()` after filters.

- `delete()` should always be combined with [filters](#/reference/javascript/using-filters) to target the item(s) you wish to delete.

- If you use `delete()` with filters and you have [RLS](https://supabase.com/docs/learn/auth-deep-dive/auth-row-level-security) enabled, only rows visible through `SELECT` policies are deleted. Note that by default no rows are visible, so you need at least one `SELECT`/`ALL` policy that makes the rows visible.

- When using `delete().in()`, specify an array of values to target multiple rows with a single query. This is particularly useful for batch deleting entries that share common criteria, such as deleting users by their IDs. Ensure that the array you provide accurately represents all records you intend to delete to avoid unintended data removal.

## Parameters

- optionsobject

Named parameters

```typescript
const response = await supabase
  .from('countries')
  .delete()
  .eq('id', 1)
```
