`updateProvider(identifier, params)`

Updates an existing custom provider.

When `issuer` or `discovery_url` is changed on an OIDC provider, the server re-fetches and validates the discovery document before persisting. This may return a validation error (`error_code: "validation_failed"`) if the discovery document is unreachable, invalid, or the issuer does not match.

This function should only be called on a server. Never expose your `service_role` key in the browser.

## Parameters

- identifierstring

- paramsUpdateCustomProviderParams

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object
