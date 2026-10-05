`listBuckets(options?)`

Retrieves the details of all Storage buckets within an existing project.

- RLS policy permissions required:

- `buckets` table permissions: `select`

- `objects` table permissions: none

- Refer to the [Storage guide](https://supabase.com/docs/guides/storage/security/access-control) on how access control works

## Parameters

- optionsOptionalListBucketOptions

Query parameters for listing buckets

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .listBuckets()
```
