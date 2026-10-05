`maybeSingle()`

Return `data` as a single object instead of an array of objects.

Query result must be zero or one row (e.g. using `.limit(1)`), otherwise this returns an error.

```typescript
const { data, error } = await supabase
  .from('characters')
  .select()
  .eq('name', 'Katniss')
  .maybeSingle()
```
