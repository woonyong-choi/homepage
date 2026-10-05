`download(path, options?, parameters?)`

Downloads a file from a private bucket. For public buckets, make a request to the URL returned from `getPublicUrl` instead.

- RLS policy permissions required:

- `buckets` table permissions: none

- `objects` table permissions: `select`

- Refer to the [Storage guide](https://supabase.com/docs/guides/storage/security/access-control) on how access control works

## Parameters

- pathstring

The full path and file name of the file to be downloaded. For example `folder/image.png`.

- optionsOptionalOptions

Optional settings: `transform` to transform the asset before serving it to the client, `cacheNonce` to append a cache nonce parameter to the URL to invalidate the cache, and `versionId` to download a specific object version.

- parametersOptionalFetchParameters

Additional fetch parameters like signal for cancellation. Supports standard fetch options including cache control.

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .download('folder/avatar1.png')
```
