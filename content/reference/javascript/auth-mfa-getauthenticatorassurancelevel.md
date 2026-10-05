`getAuthenticatorAssuranceLevel(jwt?)`

Returns the Authenticator Assurance Level (AAL) for the active session.

- `aal1` (or `null`) means that the user's identity has been verified only with a conventional login (email+password, OTP, magic link, social login, etc.).

- `aal2` means that the user's identity has been verified both with a conventional login and at least one MFA factor.

When called without a JWT parameter, this method is fairly quick (microseconds) and rarely uses the network. When a JWT is provided (useful in server-side environments like Edge Functions where no session is stored), this method will make a network request to validate the user and fetch their MFA factors.

- Authenticator Assurance Level (AAL) is the measure of the strength of an authentication mechanism.

- In Supabase, having an AAL of `aal1` refers to having the 1st factor of authentication such as an email and password or OAuth sign-in while `aal2` refers to the 2nd factor of authentication such as a time-based, one-time-password (TOTP) or Phone factor.

- If the user has a verified factor, the `nextLevel` field will return `aal2`, else, it will return `aal1`.

- An optional `jwt` parameter can be passed to check the AAL level of a specific JWT instead of the current session.

## Parameters

- jwtOptionalstring

Takes in an optional access token JWT. If no JWT is provided, the JWT from the current session is used.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
const { currentLevel, nextLevel, currentAuthenticationMethods } = data
```
