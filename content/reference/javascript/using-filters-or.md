`or(filters, options)`

Match only rows which satisfy at least one of the filters.

Unlike most filters, `filters` is used as-is and needs to follow [PostgREST syntax](https://postgrest.org/en/stable/api.html#operators). You also need to make sure it's properly sanitized.

It's currently not possible to do an `.or()` filter across multiple tables.

or() expects you to use the raw PostgREST syntax for the filter names and values.

```typescript
.or('id.in.(5,6,7), arraycol.cs.{"a","b"}')  // Use `()` for `in` filter, `{}` for array values and `cs` for `contains()`.
.or('id.in.(5,6,7), arraycol.cd.{"a","b"}')  // Use `cd` for `containedBy()`
```

## Parameters

- filtersstring

The filters to use, following PostgREST syntax

- optionsobject

Named parameters

## Return Type

this

```typescript
const { data, error } = await supabase
  .from('characters')
  .select('name')
  .or('id.eq.2,name.eq.Han')
```
