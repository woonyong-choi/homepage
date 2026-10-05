`approveAuthorization(authorizationId, options?)`

Approves an OAuth authorization request. Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.

After approval, the user's consent is stored and an authorization code is generated. The response contains a complete redirect URL with the authorization code and state.

## Parameters

- authorizationIdstring

The authorization ID to approve

- optionsOptionalobject

Optional parameters

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object
