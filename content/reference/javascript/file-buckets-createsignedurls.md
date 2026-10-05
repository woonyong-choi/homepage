`createSignedUrls(paths, expiresIn, options?)`

Creates multiple signed URLs. Use a signed URL to share a file for a fixed amount of time.

- RLS policy permissions required:

- `buckets` table permissions: none

- `objects` table permissions: `select`

- Refer to the [Storage guide](https://supabase.com/docs/guides/storage/security/access-control) on how access control works

## Parameters

- pathsArray<string>

The file paths to be downloaded, including the current file names. For example `['folder/image.png', 'folder2/image2.png']`.

- expiresInnumber

The number of seconds until the signed URLs expire. For example, `60` for URLs which are valid for one minute.

- optionsOptionalobject

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .createSignedUrls(['folder/avatar1.png', 'folder/avatar2.png'], 60)
```
