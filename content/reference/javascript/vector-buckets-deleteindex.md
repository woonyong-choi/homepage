`deleteIndex(indexName)`

Deletes an index from this bucket Convenience method that automatically includes the bucket name

**Public alpha:** This API is part of a public alpha release and may not be available to your account type.

## Parameters

- indexNamestring

Name of the index to delete

## Return Type

Promise<One of the following options>
- Option 1SuccessResponse

- Option 2ErrorResponse

```typescript
const bucket = supabase.storage.vectors.from('embeddings-prod')
await bucket.deleteIndex('old-index')
```
