`updateBucketLifecycle(id, configuration)`

Replaces the lifecycle policy on a bucket.

The `rules` array you send is the whole policy. Anything previously stored is overwritten. Send at least one rule. Call deleteBucketLifecycle to remove the policy.

Each rule currently supports only `noncurrentVersionExpiration`. `filter` is required and must be `{}`. Prefix filters, tag filters, and current-object expiration are rejected. Rule IDs must be unique. Omit `id` and the server generates one.

Standard buckets only. Returns `FeatureNotEnabled` if lifecycle is off for the project.

- RLS policy permissions required:

- `buckets` table permissions: `select` and `update`

- `objects` table permissions: none

- Refer to the [Storage guide](https://supabase.com/docs/guides/storage/security/access-control) on how access control works

## Parameters

- idstring

The unique identifier of the bucket.

- configurationBucketLifecycleConfiguration

The full lifecycle configuration to store.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .updateBucketLifecycle('avatars', {
    rules: [
      {
        id: 'expire-history',
        status: 'Enabled',
        filter: {},
        noncurrentVersionExpiration: {
          noncurrentDays: 30,
          newerNoncurrentVersions: 2,
        },
      },
    ],
  })
```
