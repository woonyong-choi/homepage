`createSignedUrl(path, expiresIn, options?)`

Creates a signed URL. Use a signed URL to share a file for a fixed amount of time.

- RLS policy permissions required:

- `buckets` table permissions: none

- `objects` table permissions: `select`

- Refer to the [Storage guide](https://supabase.com/docs/guides/storage/security/access-control) on how access control works

## Parameters

- pathstring

The file path, including the current file name. For example `folder/image.png`.

- expiresInnumber

The number of seconds until the signed URL expires. For example, `60` for a URL which is valid for one minute.

- optionsOptionalobject

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .createSignedUrl('folder/avatar1.png', 60)
```
