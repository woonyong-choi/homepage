`createIndex(options)`

Creates a new vector index in this bucket Convenience method that automatically includes the bucket name

**Public alpha:** This API is part of a public alpha release and may not be available to your account type.

## Parameters

- optionsOmit

Index configuration (vectorBucketName is automatically set)

## Return Type

Promise<One of the following options>
- Option 1SuccessResponse

- Option 2ErrorResponse

```typescript
const bucket = supabase.storage.vectors.from('embeddings-prod')
await bucket.createIndex({
  indexName: 'documents-openai',
  dataType: 'float32',
  dimension: 1536,
  distanceMetric: 'cosine',
  metadataConfiguration: {
    nonFilterableMetadataKeys: ['raw_text']
  }
})
```
