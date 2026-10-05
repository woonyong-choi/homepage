`upsert(values, options)`

Perform an UPSERT on the table or view. Depending on the column(s) passed to `onConflict`, `.upsert()` allows you to perform the equivalent of `.insert()` if a row with the corresponding `onConflict` columns doesn't exist, or if it does exist, perform an alternative action depending on `ignoreDuplicates`.

By default, upserted rows are not returned. To return it, chain the call with `.select()`.

- Primary keys must be included in `values` to use upsert.

## Parameters

- valuesOne of the following options

The values to upsert with. Pass an object to upsert a single row or an array to upsert multiple rows.

- Option 1RejectExcessProperties

- Option 2Array<RejectExcessProperties>

- optionsobject

Named parameters

```typescript
// Upserting a single row, overwriting based on the 'username' unique column
const { data, error } = await supabase
  .from('users')
  .upsert({ username: 'supabot' }, { onConflict: 'username' })

// Example response:
// {
//   data: [
//     { id: 4, message: 'bar', username: 'supabot' }
//   ],
//   error: null
// }
```
