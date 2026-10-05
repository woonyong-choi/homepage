`overrideTypes()`

Override the type of the returned `data` field in the response.

```typescript
// Merge with existing types (default behavior)
const query = supabase
  .from('users')
  .select()
  .overrideTypes<{ custom_field: string }>()

// Replace existing types completely
const replaceQuery = supabase
  .from('users')
  .select()
  .overrideTypes<{ id: number; name: string }, { merge: false }>()
```
