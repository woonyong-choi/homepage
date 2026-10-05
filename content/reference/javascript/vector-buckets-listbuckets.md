`listBuckets(options)`

Lists all vector buckets with optional filtering and pagination

**Public alpha:** This API is part of a public alpha release and may not be available to your account type.

## Parameters

- optionsListVectorBucketsOptions

Optional filters (prefix, maxResults, nextToken)

## Return Type

Promise<One of the following options>
- Option 1SuccessResponse

- Option 2ErrorResponse

```typescript
const { data, error } = await supabase
  .storage
  .vectors
  .listBuckets({ prefix: 'embeddings-' })

data?.vectorBuckets.forEach(bucket => {
  console.log(bucket.vectorBucketName)
})
```
