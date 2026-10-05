`deleteBucketLifecycle(id)`

Removes the lifecycle policy from a bucket.

Safe to call when no policy is stored. The response is still success. Standard buckets only. Returns `FeatureNotEnabled` if lifecycle is off for the project.

- RLS policy permissions required:

- `buckets` table permissions: `select` and `update`

- `objects` table permissions: none

- Refer to the [Storage guide](https://supabase.com/docs/guides/storage/security/access-control) on how access control works

## Parameters

- idstring

The unique identifier of the bucket.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .deleteBucketLifecycle('avatars')
```
