`invoke(functionName, options)`

Invokes a function

- The API key is sent in the `apikey` header. The `Authorization` header is reserved for the signed-in user's JWT (or a custom auth token) — when there is no session, a new-format API key (`sb_publishable_…` / `sb_secret_…`) is not sent as a Bearer token.

- Invoke params generally match the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) spec.

- When you pass in a body to your function, we automatically attach the Content-Type header for `Blob`, `ArrayBuffer`, `File`, `FormData` and `String`. If it doesn't match any of these types we assume the payload is `json`, serialize it and attach the `Content-Type` header as `application/json`. You can override this behavior by passing in a `Content-Type` header of your own.

- Responses are automatically parsed as `json`, `blob` and `form-data` depending on the `Content-Type` header sent by your function. Responses are parsed as `text` by default.

## Parameters

- functionNamestring

The name of the Function to invoke.

- optionsFunctionInvokeOptions

Options for invoking the Function.

## Return Type

Promise<One of the following options>
- Option 1FunctionsResponseSuccess

- Option 2FunctionsResponseFailure

```typescript
const { data, error } = await functions.invoke('hello-world', {
  body: { name: 'Ada' },
})
```
