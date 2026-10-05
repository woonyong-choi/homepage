`getBucketLifecycle(id)`

Returns the lifecycle policy stored on a bucket.

Fails with `NoSuchLifecycleConfiguration` when the bucket has no policy.

These rules expire previous versions of objects, not the current one. Turn versioning on or there is nothing for the policy to act on. Standard buckets only. Returns `FeatureNotEnabled` if lifecycle is off for the project.

- RLS policy permissions required:

- `buckets` table permissions: `select`

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
  .getBucketLifecycle('avatars')
```
