Filters allow you to only return rows that match certain conditions.

Filters can be used on `select()`, `update()`, `upsert()`, and `delete()` queries.

If a Postgres function returns a table response, you can also apply filters.

```typescript
const { data, error } = await supabase
  .from('instruments')
  .select('name, section_id')
  .eq('name', 'violin')    // Correct

const { data, error } = await supabase
  .from('instruments')
  .eq('name', 'violin')    // Incorrect
  .select('name, section_id')
```
