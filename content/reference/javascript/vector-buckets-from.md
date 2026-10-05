`from(vectorBucketName)`

Access operations for a specific vector bucket Returns a scoped client for index and vector operations within the bucket

**Public alpha:** This API is part of a public alpha release and may not be available to your account type.

## Parameters

- vectorBucketNamestring

Name of the vector bucket

```typescript
const bucket = supabase.storage.vectors.from('embeddings-prod')
```
