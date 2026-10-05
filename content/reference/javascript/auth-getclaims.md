`getClaims(jwt?, options)`

Extracts the JWT claims present in the access token by first verifying the JWT against the server's JSON Web Key Set endpoint `/.well-known/jwks.json` which is often cached, resulting in significantly faster responses. Prefer this method over GoTrueClient.getUser which always sends a request to the Auth server for each JWT.

If the project is not using an asymmetric JWT signing key (like ECC or RSA) it always sends a request to the Auth server (similar to GoTrueClient.getUser) to verify the JWT.

- Parses the user's [access token](https://supabase.com/docs/guides/auth/sessions#access-token-jwt-claims) as a [JSON Web Token (JWT)](https://supabase.com/docs/guides/auth/jwts) and returns its components if valid and not expired.

- If your project is using asymmetric JWT signing keys, then the verification is done locally usually without a network request using the [WebCrypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API).

- A network request is sent to your project's JWT signing key discovery endpoint `https://project-id.supabase.co/auth/v1/.well-known/jwks.json`, which is cached locally. If your environment is ephemeral, such as a Lambda function that is destroyed after every request, a network request will be sent for each new invocation. Supabase provides a network-edge cache providing fast responses for these situations.

- If the user's access token is about to expire when calling this function, the user's session will first be refreshed before validating the JWT.

- If your project is using a symmetric secret to sign the JWT, it always sends a request similar to `getUser()` to validate the JWT at the server before returning the decoded token. This is also used if the WebCrypto API is not available in the environment. Make sure you polyfill it in such situations.

- The returned claims can be customized per project using the [Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook).

## Parameters

- jwtOptionalstring

An optional specific JWT you wish to verify, not the one you can obtain from GoTrueClient.getSession.

- optionsobject

Various additional options that allow you to customize the behavior of this method.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

- Option 3object

```typescript
const { data, error } = await supabase.auth.getClaims()
```
