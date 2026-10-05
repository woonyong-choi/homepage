`getOpenApiSpec()`

Fetch the OpenAPI description PostgREST publishes for this client's schema.

The document lists only the tables, views and functions the caller's role holds privileges on; PostgREST applies that filtering server-side. The schema is the one this client was created with, so call `.schema()` first to describe a different one. Transient failures are retried according to the client's `retry` option, like any other idempotent request.

## Return Type

Promise<One of the following options>
- Option 1PostgrestResponseSuccess

- Option 2PostgrestResponseFailure

```typescript
const { data, error } = await supabase.getOpenApiSpec()
```
