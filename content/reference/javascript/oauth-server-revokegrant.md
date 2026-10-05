`revokeGrant(options)`

Revokes a user's OAuth grant for a specific client. Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.

Revocation marks consent as revoked, deletes active sessions for that OAuth client, and invalidates associated refresh tokens.

## Parameters

- optionsobject

Revocation options

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object
