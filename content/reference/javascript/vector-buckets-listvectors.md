`listVectors(options)`

Lists vectors in this index with pagination Convenience method that automatically includes bucket and index names

**Public alpha:** This API is part of a public alpha release and may not be available to your account type.

## Parameters

- optionsOmit

Listing options (bucket and index names automatically set)

## Return Type

Promise<One of the following options>
- Option 1SuccessResponse

- Option 2ErrorResponse

```typescript
const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
const { data } = await index.listVectors({
  maxResults: 500,
  returnMetadata: true
})
```
