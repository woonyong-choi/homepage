`select(columns?)`

Perform a SELECT on the query result.

By default, `.insert()`, `.update()`, `.upsert()`, and `.delete()` do not return modified rows. By calling this method, modified rows are returned in `data`.

## Parameters

- columnsOptionalQuery

The columns to retrieve, separated by commas

```typescript
const { data, error } = await supabase
  .from('characters')
  .upsert({ id: 1, name: 'Han Solo' })
  .select()
```
