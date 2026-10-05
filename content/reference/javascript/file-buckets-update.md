`update(path, fileBody, fileOptions?)`

Replaces an existing file at the specified path with a new one.

- RLS policy permissions required:

- `buckets` table permissions: none

- `objects` table permissions: `update` and `select`

- `update()` always replaces the file at the given path regardless of the `upsert` option.

- Refer to the [Storage guide](https://supabase.com/docs/guides/storage/security/access-control) on how access control works

- For React Native, using either `Blob`, `File` or `FormData` does not work as intended. Update file using `ArrayBuffer` from base64 file data instead, see example below.

## Parameters

- pathstring

The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to update.

- fileBodyOne of the following options

The body of the file to be stored in the bucket.

- Option 1string

- Option 2ArrayBuffer

- Option 3ReadableStream

- Option 4Blob

- Option 5File

- Option 6FormData

- Option 7@types/node.__global.NodeJS.ReadableStream

- Option 8URLSearchParams

- Option 9ArrayBufferView

- Option 10@types/node.__global.Buffer

- fileOptionsOptionalFileOptions

Optional file upload options including cacheControl, contentType, and metadata. **Note:** The `upsert` option has no effect here. `update()` always replaces the file at the given path, so the `x-upsert` header is not sent. To control upsert behavior, use `upload()` instead.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const avatarFile = event.target.files[0]
const { data, error } = await supabase
  .storage
  .from('avatars')
  .update('public/avatar1.png', avatarFile, {
    cacheControl: '3600'
  })
```
