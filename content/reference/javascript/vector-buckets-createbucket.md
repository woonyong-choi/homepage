`createBucket(vectorBucketName)`

Creates a new vector bucket Vector buckets are containers for vector indexes and their data

**Public alpha:** This API is part of a public alpha release and may not be available to your account type.

## Parameters

- vectorBucketNamestring

Unique name for the vector bucket

## Return Type

Promise<One of the following options>
- Option 1SuccessResponse

- Option 2ErrorResponse

```typescript
const { data, error } = await supabase
  .storage
  .vectors
  .createBucket('embeddings-prod')
```
