`createSignedUploadUrl(path, options?)`

Creates a signed upload URL. Signed upload URLs can be used to upload files to the bucket without further authentication. They are valid for 2 hours.

- RLS policy permissions required:

- `buckets` table permissions: none

- `objects` table permissions: `insert`

- Refer to the [Storage guide](https://supabase.com/docs/guides/storage/security/access-control) on how access control works

## Parameters

- pathstring

The file path, including the current file name. For example `folder/image.png`.

- optionsOptionalobject

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .createSignedUploadUrl('folder/cat.jpg')
```
