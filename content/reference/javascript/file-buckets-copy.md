`copy(fromPath, toPath, options?)`

Copies an existing file to a new path in the same bucket.

- RLS policy permissions required:

- `buckets` table permissions: none

- `objects` table permissions: `insert` and `select`

- Refer to the [Storage guide](https://supabase.com/docs/guides/storage/security/access-control) on how access control works

## Parameters

- fromPathstring

The original file path, including the current file name. For example `folder/image.png`.

- toPathstring

The new file path, including the new file name. For example `folder/image-copy.png`.

- optionsOptionalDestinationOptions

The destination options.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .copy('public/avatar1.png', 'private/avatar2.png')
```
