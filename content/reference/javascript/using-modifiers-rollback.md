`rollback()`

Dry-run this request: execute the query but discard the changes.

Server-side, PostgREST runs the query inside a transaction and rolls it back instead of committing. The response still contains the data that would have been returned — `RETURNING` clauses execute and RLS, triggers, and constraints are all evaluated — but no row is actually inserted, updated, or deleted.

This affects only the single request it is chained to. The JS caller has no handle on the transaction: supabase-js does not group multiple queries into one transaction. For multi-statement transactional logic, use a database function (`supabase.rpc(...)`).

Sets the `Prefer: tx=rollback` header. See PostgREST's docs on transaction preferences for the underlying mechanism.

## Return Type

this

```typescript
const { data, error } = await supabase
  .from('countries')
  .insert({ name: 'France' })
  .select()
  .rollback()
// `data` shows what would have been inserted; nothing is saved.
```
