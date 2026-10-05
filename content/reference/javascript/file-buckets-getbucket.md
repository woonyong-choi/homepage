`getBucket(id)`

Retrieves the details of an existing Storage bucket.

- RLS policy permissions required:

- `buckets` table permissions: `select`

- `objects` table permissions: none

- Refer to the [Storage guide](https://supabase.com/docs/guides/storage/security/access-control) on how access control works

## Parameters

- idstring

The unique identifier of the bucket you would like to retrieve.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .getBucket('avatars')
```
