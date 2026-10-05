`uploadToSignedUrl(path, token, fileBody, fileOptions?)`

Upload a file with a token generated from `createSignedUploadUrl`.

- RLS policy permissions required:

- `buckets` table permissions: none

- `objects` table permissions: none

- Refer to the [Storage guide](https://supabase.com/docs/guides/storage/security/access-control) on how access control works

## Parameters

- pathstring

The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.

- tokenstring

The token generated from `createSignedUploadUrl`

- fileBodyFileBody

The body of the file to be stored in the bucket.

- fileOptionsOptionalFileOptions

HTTP headers (cacheControl, contentType, etc.). **Note:** The `upsert` option has no effect here. To enable upsert behavior, pass `{ upsert: true }` when calling `createSignedUploadUrl()` instead.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .uploadToSignedUrl('folder/cat.jpg', 'token-from-createSignedUploadUrl', file)
```
