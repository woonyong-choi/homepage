`is(column, value)`

Match only rows where `column` IS `value`.

For non-boolean columns, this is only relevant for checking if the value of `column` is NULL by setting `value` to `null`.

For boolean columns, you can also set `value` to `true` or `false` and it will behave the same way as `.eq()`.

## Parameters

- columnOne of the following options

The column to filter on

- Option 1ColumnName

- Option 2string

- valueOne of the following options

The value to filter with

- Option 1null

- Option 2boolean

## Return Type

this

```typescript
const { data, error } = await supabase
  .from('countries')
  .select()
  .is('name', null)
```
