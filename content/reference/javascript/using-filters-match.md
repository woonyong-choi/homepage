`match(query)`

Match only rows where each column in `query` keys is equal to its associated value. Shorthand for multiple `.eq()`s.

## Parameters

- queryOne of the following options

The object to filter with, with column names as keys mapped to their filter values

- Option 1Record<ColumnName, Row['ColumnName']>

- Option 2Record<string, unknown>

## Return Type

this

```typescript
const { data, error } = await supabase
  .from('characters')
  .select('name')
  .match({ id: 2, name: 'Leia' })
```
