`listIndexes(options)`

Lists indexes in this bucket Convenience method that automatically includes the bucket name

**Public alpha:** This API is part of a public alpha release and may not be available to your account type.

## Parameters

- optionsOmit

Listing options (vectorBucketName is automatically set)

## Return Type

Promise<One of the following options>
- Option 1SuccessResponse

- Option 2ErrorResponse

```typescript
const bucket = supabase.storage.vectors.from('embeddings-prod')
const { data } = await bucket.listIndexes({ prefix: 'documents-' })
```
