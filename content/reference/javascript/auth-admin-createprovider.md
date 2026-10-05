`createProvider(params)`

Creates a new custom OIDC/OAuth provider.

For OIDC providers, the server fetches and validates the OpenID Connect discovery document from the issuer's well-known endpoint (or the provided `discovery_url`) at creation time. This may return a validation error (`error_code: "validation_failed"`) if the discovery document is unreachable, not valid JSON, missing required fields, or if the issuer in the document does not match the expected issuer.

This function should only be called on a server. Never expose your `service_role` key in the browser.

## Parameters

- paramsCreateCustomProviderParams

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object
