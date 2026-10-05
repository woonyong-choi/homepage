`denyAuthorization(authorizationId, options?)`

Denies an OAuth authorization request. Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.

After denial, the response contains a redirect URL with an OAuth error (access_denied) to inform the OAuth client that the user rejected the request.

## Parameters

- authorizationIdstring

The authorization ID to deny

- optionsOptionalobject

Optional parameters

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object
