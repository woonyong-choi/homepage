`VectorBucketScope(indexName)`

Access operations for a specific index within this bucket Returns a scoped client for vector data operations

**Public alpha:** This API is part of a public alpha release and may not be available to your account type.

## Parameters

- indexNamestring

Name of the index

```typescript
const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')

// Insert vectors
await index.putVectors({
  vectors: [
    { key: 'doc-1', data: { float32: [...] }, metadata: { title: 'Intro' } }
  ]
})

// Query similar vectors
const { data } = await index.queryVectors({
  queryVector: { float32: [...] },
  topK: 5
})
```
