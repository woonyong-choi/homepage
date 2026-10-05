`remove(paths)`

Deletes files within the same bucket

Returns an array of FileObject entries for the deleted files. Note that deprecated fields like `bucket_id` may or may not be present in the response - do not rely on them.

- RLS policy permissions required:

- `buckets` table permissions: none

- `objects` table permissions: `delete` and `select`

- Refer to the [Storage guide](https://supabase.com/docs/guides/storage/security/access-control) on how access control works

## Parameters

- pathsArray<One of the following options>

An array of files to delete. Each entry is either a path (deletes whichever version is currently at that path, e.g. `'folder/image.png'`), or `{ path, versionId }` to delete an exact version current or archived (e.g. `{ path: 'folder/image.png', versionId: '...' }`).

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .remove(['folder/avatar1.png'])
```
