`getBucket(vectorBucketName)`

Retrieves metadata for a specific vector bucket

**Public alpha:** This API is part of a public alpha release and may not be available to your account type.

## Parameters

- vectorBucketNamestring

Name of the vector bucket

## Return Type

Promise<One of the following options>
- Option 1SuccessResponse

- Option 2ErrorResponse

```typescript
const { data, error } = await supabase
  .storage
  .vectors
  .getBucket('embeddings-prod')

console.log('Bucket created:', data?.vectorBucket.creationTime)
```
