`csv()`

Return `data` as a string in CSV format.

```typescript
const { data, error } = await supabase
  .from('characters')
  .select()
  .csv()
```
