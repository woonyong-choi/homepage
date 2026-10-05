`emptyBucket(id)`

Removes all objects inside a single bucket.

- RLS policy permissions required:

- `buckets` table permissions: `select`

- `objects` table permissions: `select` and `delete`

- Refer to the [Storage guide](https://supabase.com/docs/guides/storage/security/access-control) on how access control works

## Parameters

- idstring

The unique identifier of the bucket you would like to empty.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .emptyBucket('avatars')
```
