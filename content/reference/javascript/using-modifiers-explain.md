`explain(options)`

Return `data` as the EXPLAIN plan for the query.

You need to enable the [db_plan_enabled](https://supabase.com/docs/guides/database/debugging-performance#enabling-explain) setting before using this method.

## Parameters

- optionsobject

Named parameters

## Return Type

One of the following options
- Option 1PostgrestBuilder

- Option 2PostgrestBuilder

```typescript
const { data, error } = await supabase
  .from('characters')
  .select()
  .explain()
```
