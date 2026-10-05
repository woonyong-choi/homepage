`not(column, operator, value)`

Match only rows which doesn't satisfy the filter.

Unlike most filters, `opearator` and `value` are used as-is and need to follow [PostgREST syntax](https://postgrest.org/en/stable/api.html#operators). You also need to make sure they are properly sanitized.

not() expects you to use the raw PostgREST syntax for the filter values.

```typescript
.not('id', 'in', '(5,6,7)')  // Use `()` for `in` filter
.not('arraycol', 'cs', '{"a","b"}')  // Use `cs` for `contains()`, `{}` for array values
```

## Parameters

- columnOne of the following options

The column to filter on

- Option 1ColumnName

- Option 2string

- operatorOne of the following options

The operator to be negated to filter with, following PostgREST syntax

- Option 1"is"

- Option 2FilterOperator

- Option 3string

- valueOne of the following options

The value to filter with, following PostgREST syntax

- Option 1null

- Option 2Row['ColumnName']

- Option 3unknown

```typescript
const { data, error } = await supabase
  .from('countries')
  .select()
  .not('name', 'is', null)
```
