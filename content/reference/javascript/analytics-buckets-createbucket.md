`createBucket(name)`

Creates a new analytics bucket using Iceberg tables Analytics buckets are optimized for analytical queries and data processing

**Public alpha:** This API is part of a public alpha release and may not be available to your account type.

- Creates a new analytics bucket using Iceberg tables

- Analytics buckets are optimized for analytical queries and data processing

## Parameters

- namestring

A unique name for the bucket you are creating

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .analytics
  .createBucket('analytics-data')
```
