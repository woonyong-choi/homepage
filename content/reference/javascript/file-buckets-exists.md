`exists(path)`

Checks the existence of a file.

## Parameters

- pathstring

The file path, including the file name. For example `folder/image.png`.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .exists('folder/avatar1.png')
```
