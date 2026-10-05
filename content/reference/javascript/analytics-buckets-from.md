`from(bucketName)`

Get an Iceberg REST Catalog client configured for a specific analytics bucket Use this to perform advanced table and namespace operations within the bucket The returned client provides full access to the Apache Iceberg REST Catalog API with the Supabase `{ data, error }` pattern for consistent error handling on all operations.

**Public alpha:** This API is part of a public alpha release and may not be available to your account type.

This method provides a bridge between Supabase's bucket management and the standard Apache Iceberg REST Catalog API. The bucket name maps to the Iceberg warehouse parameter. All authentication and configuration is handled automatically using your Supabase credentials.

**Error Handling**: Invalid bucket names throw immediately. All catalog operations return `{ data, error }` where errors are `IcebergError` instances from iceberg-js. Use helper methods like `error.isNotFound()` or check `error.status` for specific error handling. Use `.throwOnError()` on the analytics client if you prefer exceptions for catalog operations.

**Cleanup Operations**: When using `dropTable`, the `purge: true` option permanently deletes all table data. Without it, the table is marked as deleted but data remains.

**Library Dependency**: The returned catalog wraps `IcebergRestCatalog` from iceberg-js. For complete API documentation and advanced usage, refer to the [iceberg-js documentation](https://supabase.github.io/iceberg-js/).

## Parameters

- bucketNamestring

The name of the analytics bucket (warehouse) to connect to

```typescript
// First, create an analytics bucket
const { data: bucket, error: bucketError } = await supabase
  .storage
  .analytics
  .createBucket('analytics-data')

// Get the Iceberg catalog for that bucket
const catalog = supabase.storage.analytics.from('analytics-data')

// Create a namespace
const { error: nsError } = await catalog.createNamespace({ namespace: ['default'] })

// Create a table with schema
const { data: tableMetadata, error: tableError } = await catalog.createTable(
  { namespace: ['default'] },
  {
    name: 'events',
    schema: {
      type: 'struct',
      fields: [
        { id: 1, name: 'id', type: 'long', required: true },
        { id: 2, name: 'timestamp', type: 'timestamp', required: true },
        { id: 3, name: 'user_id', type: 'string', required: false }
      ],
      'schema-id': 0,
      'identifier-field-ids': [1]
    },
    'partition-spec': {
      'spec-id': 0,
      fields: []
    },
    'write-order': {
      'order-id': 0,
      fields: []
    },
    properties: {
      'write.format.default': 'parquet'
    }
  }
)
```
