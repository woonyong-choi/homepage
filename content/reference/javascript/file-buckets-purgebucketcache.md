`purgeBucketCache(id, options?, parameters?)`

Purges the CDN cache for an entire bucket.

Maps to `DELETE /cdn/{bucket}` on the Storage API. The server issues a CDN invalidation for the bucket and returns `{ message: 'success' }`.

**Requires the `service_role` key.** The underlying endpoint enforces `service_role` JWT — calls made with the anon key or a user JWT will be rejected by the server.

**Hosted CDN feature.** On self-hosted Supabase, the Storage service must have `CDN_PURGE_ENDPOINT_URL` configured and the `purgeCache` tenant feature enabled, otherwise the server returns an error.

## Parameters

- idstring

The unique identifier of the bucket you would like to purge from cache.

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
  .purgeBucketCache('avatars')
```
