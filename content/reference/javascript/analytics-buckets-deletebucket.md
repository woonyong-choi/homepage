`deleteBucket(bucketName)`

Deletes an existing analytics bucket A bucket can't be deleted with existing objects inside it You must first empty the bucket before deletion

**Public alpha:** This API is part of a public alpha release and may not be available to your account type.

- Deletes an analytics bucket

## Parameters

- bucketNamestring

The unique identifier of the bucket you would like to delete

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase
  .storage
  .analytics
  .deleteBucket('analytics-data')
```
