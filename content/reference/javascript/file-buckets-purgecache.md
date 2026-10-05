`purgeCache(path, options?, parameters?)`

Purges the CDN cache for a single object in this bucket.

Maps to `DELETE /cdn/{bucket}/{path}` on the Storage API. The server issues a CDN invalidation for the object and returns `{ message: 'success' }`.

**Requires the `service_role` key.** The underlying endpoint enforces `service_role` JWT — calls made with the anon key or a user JWT will be rejected by the server.

**Hosted CDN feature.** On self-hosted Supabase, the Storage service must have `CDN_PURGE_ENDPOINT_URL` configured and the `purgeCache` tenant feature enabled, otherwise the server returns an error.

Operates on a single object path. There is no wildcard or recursion: pass the exact path of the object you want invalidated.

## Parameters

- pathstring

The path (relative to the bucket) of the object to purge, e.g. `folder/avatar.png`.

- optionsOptionalPurgeCacheOptions

Optional purge cache options.

- parametersOptionalFetchParameters

Optional fetch parameters such as an `AbortController` signal.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .purgeCache('folder/avatar1.png')
```
