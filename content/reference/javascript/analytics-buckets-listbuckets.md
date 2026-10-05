`listBuckets(options?)`

Retrieves the details of all Analytics Storage buckets within an existing project Only returns buckets of type 'ANALYTICS'

**Public alpha:** This API is part of a public alpha release and may not be available to your account type.

- Retrieves the details of all Analytics Storage buckets within an existing project

- Only returns buckets of type 'ANALYTICS'

## Parameters

- optionsOptionalobject

Query parameters for listing buckets

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .analytics
  .listBuckets({
    limit: 10,
    offset: 0,
    sortColumn: 'created_at',
    sortOrder: 'desc'
  })
```
