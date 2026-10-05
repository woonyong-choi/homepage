`registerPasskey(credentials?)`

Register a passkey for the current authenticated user. Handles the full WebAuthn ceremony:

- Fetches registration challenge from server

- Prompts user via navigator.credentials.create()

- Verifies credential with server

Requires an active session.

## Parameters

- credentialsOptionalRegisterPasskeyCredentials

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object
