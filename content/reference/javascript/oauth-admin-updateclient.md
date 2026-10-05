`updateClient(clientId, params)`

Updates an existing OAuth client. Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.

This function should only be called on a server. Never expose your `service_role` key in the browser.

## Parameters

- clientIdstring

- paramsUpdateOAuthClientParams

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object
