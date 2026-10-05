`insert(values, options)`

Perform an INSERT into the table or view.

By default, inserted rows are not returned. To return it, chain the call with `.select()`.

## Parameters

- valuesOne of the following options

The values to insert. Pass an object to insert a single row or an array to insert multiple rows.

- Option 1RejectExcessProperties

- Option 2Array<RejectExcessProperties>

- optionsobject

Named parameters

```typescript
const { error } = await supabase
  .from('countries')
  .insert({ id: 1, name: 'Mordor' })
```
