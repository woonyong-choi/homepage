`textSearch(column, query, options?)`

Only relevant for text and tsvector columns. Match only rows where `column` matches the query string in `query`.

- For more information, see [Postgres full text search](https://supabase.com/docs/guides/database/full-text-search).

## Parameters

- columnOne of the following options

The text or tsvector column to filter on

- Option 1ColumnName

- Option 2string

- querystring

The query text to match with

- optionsOptionalobject

Named parameters

## Return Type

this

```typescript
const result = await supabase
  .from("texts")
  .select("content")
  .textSearch("content", `'eggs' & 'ham'`, {
    config: "english",
  });
```
