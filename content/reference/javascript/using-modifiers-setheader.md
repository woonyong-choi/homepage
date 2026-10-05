`setHeader(name, value)`

Set an HTTP header on this single PostgREST request, overriding any header with the same name set on the client.

This is an advanced escape hatch for one-off needs (passing a custom `Authorization` for a single query, attaching a tracing header, etc.). Most callers do not need it: configure client-wide headers via the `headers` option when constructing the client, and authentication via Supabase Auth.

## Parameters

- namestring

HTTP header name

- valuestring

HTTP header value

## Return Type

this
