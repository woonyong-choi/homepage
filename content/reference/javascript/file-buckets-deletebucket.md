`deleteBucket(id)`

Deletes an existing bucket. A bucket can't be deleted with existing objects inside it. You must first `empty()` the bucket.

- RLS policy permissions required:

- `buckets` table permissions: `select` and `delete`

- `objects` table permissions: none

- Refer to the [Storage guide](https://supabase.com/docs/guides/storage/security/access-control) on how access control works

## Parameters

- idstring

The unique identifier of the bucket you would like to delete.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .deleteBucket('avatars')
```
