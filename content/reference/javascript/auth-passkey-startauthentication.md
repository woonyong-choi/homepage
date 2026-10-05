`startAuthentication(params?)`

Starts the passkey authentication ceremony. Fetches an authentication challenge and credential request options from the server. Used as the first step of a two-step sign-in flow when the caller wants to handle `navigator.credentials.get()` themselves.

## Parameters

- paramsOptionalStartPasskeyAuthenticationParams

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object
