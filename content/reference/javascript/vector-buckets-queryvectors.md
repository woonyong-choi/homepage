`queryVectors(options)`

Queries for similar vectors in this index Convenience method that automatically includes bucket and index names

**Public alpha:** This API is part of a public alpha release and may not be available to your account type.

## Parameters

- optionsOmit

Query options (bucket and index names automatically set)

## Return Type

Promise<One of the following options>
- Option 1SuccessResponse

- Option 2ErrorResponse

```typescript
const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
const { data } = await index.queryVectors({
  queryVector: { float32: [0.1, 0.2, ...] },
  topK: 5,
  filter: { category: 'technical' },
  returnDistance: true,
  returnMetadata: true
})
```
