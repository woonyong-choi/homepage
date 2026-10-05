`updateBucket(id, options)`

Updates a Storage bucket

- RLS policy permissions required:

- `buckets` table permissions: `select` and `update`

- `objects` table permissions: none

- Refer to the [Storage guide](https://supabase.com/docs/guides/storage/security/access-control) on how access control works

## Parameters

- idstring

A unique identifier for the bucket you are updating.

- optionsobject

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .updateBucket('avatars', {
    public: false,
    allowedMimeTypes: ['image/png'],
    fileSizeLimit: 1024
  })
```
