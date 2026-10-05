`filter(column, operator, value)`

Match only rows which satisfy the filter. This is an escape hatch - you should use the specific filter methods wherever possible.

Unlike most filters, `opearator` and `value` are used as-is and need to follow [PostgREST syntax](https://postgrest.org/en/stable/api.html#operators). You also need to make sure they are properly sanitized.

filter() expects you to use the raw PostgREST syntax for the filter values.

```typescript
.filter('id', 'in', '(5,6,7)')  // Use `()` for `in` filter
.filter('arraycol', 'cs', '{"a","b"}')  // Use `cs` for `contains()`, `{}` for array values
```

## Parameters

- columnOne of the following options

The column to filter on

- Option 1ColumnName

- Option 2string

- operatorOne of the following options

The operator to filter with, following PostgREST syntax

- Option 1FilterOperator

- Option 2"not.match"

- Option 3"not.is"

- Option 4"not.eq"

- Option 5"not.neq"

- Option 6"not.gt"

- Option 7"not.gte"

- Option 8"not.lt"

- Option 9"not.lte"

- Option 10"not.like"

- Option 11"not.ilike"

- Option 12"not.isdistinct"

- Option 13"not.in"

- Option 14"not.cs"

- Option 15"not.cd"

- Option 16"not.sl"

- Option 17"not.sr"

- Option 18"not.nxl"

- Option 19"not.nxr"

- Option 20"not.adj"

- Option 21"not.ov"

- Option 22"not.fts"

- Option 23"not.plfts"

- Option 24"not.phfts"

- Option 25"not.wfts"

- Option 26"not.imatch"

- Option 27string

- valueunknown

The value to filter with, following PostgREST syntax

## Return Type

this

```typescript
const { data, error } = await supabase
  .from('characters')
  .select()
  .filter('name', 'in', '("Han","Yoda")')
```
