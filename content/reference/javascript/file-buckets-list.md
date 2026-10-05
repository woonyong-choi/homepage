`list(path?, options?, parameters?)`

Lists all the files and folders within a path of the bucket.

**Important:** For folder entries, fields like `id`, `updated_at`, `created_at`, `last_accessed_at`, and `metadata` will be `null`. Only files have these fields populated. Additionally, deprecated fields like `bucket_id`, `owner`, and `buckets` are NOT returned by this method.

- RLS policy permissions required:

- `buckets` table permissions: none

- `objects` table permissions: `select`

- Refer to the [Storage guide](https://supabase.com/docs/guides/storage/security/access-control) on how access control works

## Parameters

- pathOptionalstring

The folder path.

- optionsOptionalSearchOptions

Search options including limit (defaults to 100), offset, sortBy, and search

- parametersOptionalFetchParameters

Optional fetch parameters including signal for cancellation

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .list('folder', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  })

// Handle files vs folders
data?.forEach(item => {
  if (item.id !== null) {
    // It's a file
    console.log('File:', item.name, 'Size:', item.metadata?.size)
  } else {
    // It's a folder
    console.log('Folder:', item.name)
  }
})
```
