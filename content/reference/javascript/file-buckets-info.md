`info(path, options?)`

Retrieves the details of an existing file.

Returns detailed file metadata including size, content type, and timestamps. Note: The API returns `last_modified` field, not `updated_at`.

## Parameters

- pathstring

The file path, including the file name. For example `folder/image.png`.

- optionsOptionalobject

Optional settings, including `versionId` to retrieve a specific object version.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .info('folder/avatar1.png')

if (data) {
  console.log('Last modified:', data.lastModified)
  console.log('Size:', data.size)
}
```
