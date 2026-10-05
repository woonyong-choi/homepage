`select(columns?, options?)`

Perform a SELECT query on the table or view.

When using `count` with `.range()` or `.limit()`, the returned `count` is the total number of rows that match your filters, not the number of rows in the current page. Use this to build pagination UI.

- By default, Supabase projects return a maximum of 1,000 rows. This setting can be changed in your project's [API settings](https://supabase.com/dashboard/project/_/settings/api). It's recommended that you keep it low to limit the payload size of accidental or malicious requests. You can use `range()` queries to paginate through your data.

- `select()` can be combined with [Filters](#/reference/javascript/using-filters)

- `select()` can be combined with [Modifiers](#/reference/javascript/using-modifiers)

- `apikey` is a reserved keyword if you're using the [Supabase Platform](#/guides/platform) and [should be avoided as a column name](https://github.com/supabase/supabase/issues/5465). *

## Parameters

- columnsOptionalQuery

The columns to retrieve, separated by commas. Columns can be renamed when returned with `customName:columnName`

- optionsOptionalobject

Named parameters

```typescript
const { data, error } = await supabase
  .from('characters')
  .select()
```
