`listV2(options?, parameters?)`

Lists all the files and folders within a bucket using the V2 API with pagination support.

**Important:** Folder entries in the `folders` array only contain `name` and optionally `key` — they have no `id`, timestamps, or `metadata` fields. Full file metadata is only available on entries in the `objects` array.

this method signature might change in the future

## Parameters

- optionsOptionalSearchV2Options

Search options including prefix, cursor for pagination, limit, with_delimiter

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
  .listV2({
    prefix: 'folder/',
    limit: 100,
  })

// Handle pagination
if (data?.hasNext) {
  const nextPage = await supabase
    .storage
    .from('avatars')
    .listV2({
      prefix: 'folder/',
      cursor: data.nextCursor,
    })
}

// Handle files vs folders
data?.objects.forEach(file => {
  if (file.id !== null) {
    console.log('File:', file.name, 'Size:', file.metadata?.size)
  }
})
data?.folders.forEach(folder => {
  console.log('Folder:', folder.name)
})
```
