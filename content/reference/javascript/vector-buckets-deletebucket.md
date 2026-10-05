`deleteBucket(vectorBucketName)`

Deletes a vector bucket (bucket must be empty) All indexes must be deleted before deleting the bucket

**Public alpha:** This API is part of a public alpha release and may not be available to your account type.

## Parameters

- vectorBucketNamestring

Name of the vector bucket to delete

## Return Type

Promise<One of the following options>
- Option 1SuccessResponse

- Option 2ErrorResponse

```typescript
const { data, error } = await supabase
  .storage
  .vectors
  .deleteBucket('embeddings-old')
```
