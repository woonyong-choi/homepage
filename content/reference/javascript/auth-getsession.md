`getSession()`

Returns the session, refreshing it if necessary.

The session returned can be null if the session is not detected which can happen in the event a user is not signed-in or has logged out.

**IMPORTANT:** This method loads values directly from the storage attached to the client. If that storage is based on request cookies for example, the values in it may not be authentic and therefore it's strongly advised against using this method and its results in such circumstances. A warning will be emitted if this is detected. Use GoTrueClient.getUser instead.

- Since the introduction of [asymmetric JWT signing keys](https://supabase.com/docs/guides/auth/signing-keys), this method is considered low-level and we encourage you to use `getClaims()` or `getUser()` instead.

- Retrieves the current [user session](https://supabase.com/docs/guides/auth/sessions) from the storage medium (local storage, cookies).

- The session contains an access token (signed JWT), a refresh token and the user object.

- If the session's access token is expired or is about to expire, this method will use the refresh token to refresh the session.

- When using in a browser, or you've called `startAutoRefresh()` in your environment (React Native, etc.) this function always returns a valid access token without refreshing the session itself, as this is done in the background. This function returns very fast.

- **IMPORTANT SECURITY NOTICE:** If using an insecure storage medium, such as cookies or request headers, the user object returned by this function **must not be trusted**. Always verify the JWT using `getClaims()` or your own JWT verification library to securely establish the user's identity and access. You can also use `getUser()` to fetch the user object directly from the Auth server for this purpose.

- Cross-tab refresh races are handled by the GoTrue server (the rotated token from the first tab is returned to subsequent tabs via the parent-of-active mechanism), so no client-side serialization is needed.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

- Option 3object

```typescript
const { data, error } = await supabase.auth.getSession()
```
