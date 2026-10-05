`upload(path, fileBody, fileOptions?)`

Uploads a file to an existing bucket.

- RLS policy permissions required:

- `buckets` table permissions: none

- `objects` table permissions: only `insert` when you are uploading new files and `select`, `insert` and `update` when you are upserting files

- Refer to the [Storage guide](https://supabase.com/docs/guides/storage/security/access-control) on how access control works

- For React Native, using either `Blob`, `File` or `FormData` does not work as intended. Upload file using `ArrayBuffer` from base64 file data instead, see example below.

## Parameters

- pathstring

The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.

- fileBodyFileBody

The body of the file to be stored in the bucket.

- fileOptionsOptionalFileOptions

Optional file upload options including cacheControl, contentType, upsert, and metadata.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const avatarFile = event.target.files[0]
const { data, error } = await supabase
  .storage
  .from('avatars')
  .upload('public/avatar1.png', avatarFile, {
    cacheControl: '3600',
    upsert: false
  })
```
