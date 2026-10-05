`startRegistration()`

Starts the passkey registration ceremony. Fetches a registration challenge and credential creation options from the server. Used as the first step of a two-step registration flow when the caller wants to handle `navigator.credentials.create()` themselves.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object
