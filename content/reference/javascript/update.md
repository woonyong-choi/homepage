`update(values, options)`

Perform an UPDATE on the table or view.

By default, updated rows are not returned. To return it, chain the call with `.select()` after filters.

- `update()` should always be combined with [Filters](#/reference/javascript/using-filters) to target the item(s) you wish to update.

## Parameters

- valuesRejectExcessProperties

The values to update with

- optionsobject

Named parameters

```typescript
const { error } = await supabase
  .from('instruments')
  .update({ name: 'piano' })
  .eq('id', 1)
```
