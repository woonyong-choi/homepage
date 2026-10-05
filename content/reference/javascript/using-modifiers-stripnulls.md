`stripNulls()`

Strip null values from the response data. Properties with `null` values will be omitted from the returned JSON objects.

Requires PostgREST 11.2.0+.

[https://docs.postgrest.org/en/stable/references/api/resource\_representation.html#stripped-nulls](https://docs.postgrest.org/en/stable/references/api/resource%5C_representation.html#stripped-nulls)

## Return Type

this

```typescript
const { data, error } = await supabase
  .from('characters')
  .select()
  .stripNulls()
```
