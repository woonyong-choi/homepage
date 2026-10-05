`signOut(options)`

Inside a browser context, `signOut()` will remove the logged in user from the browser session and log them out - removing all items from localstorage and then trigger a `"SIGNED_OUT"` event.

For server-side management, you can revoke all refresh tokens for a user by passing a user's JWT through to `auth.api.signOut(JWT: string)`. There is no way to revoke a user's access token jwt until it expires. It is recommended to set a shorter expiry on the jwt for this reason.

If using `others` scope, no `SIGNED_OUT` event is fired!

**Warning:** the default `scope` is `'global'`. This signs the user out of **every device they are currently signed in on**, not just the current tab/session. If you only want to sign the user out of the current session (the behavior most other auth libraries default to), pass `{ scope: 'local' }` explicitly.

- In order to use the `signOut()` method, the user needs to be signed in first.

- By default, `signOut()` uses the **global** scope, which signs out the user on every device they are signed in on (not just the current one). Pass `{ scope: 'local' }` to only sign out the current session. This is usually what apps want on a "Sign out" button, especially when users sign in from multiple devices and do not expect signing out of one to terminate the others.

- Since Supabase Auth uses JWTs for authentication, the access token JWT will be valid until it's expired. When the user signs out, Supabase revokes the refresh token and deletes the JWT from the client-side. This does not revoke the JWT and it will still be valid until it expires.

## Parameters

- optionsSignOut

## Return Type

Promise<object>

```typescript
const { error } = await supabase.auth.signOut()
```
