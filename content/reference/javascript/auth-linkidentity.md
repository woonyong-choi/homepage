`linkIdentity(credentials)`

Links an oauth identity to an existing user. This method supports the PKCE flow.

- The **Enable Manual Linking** option must be enabled from your [project's authentication settings](https://supabase.com/dashboard/project/_/auth/providers).

- The user needs to be signed in to call `linkIdentity()`.

- If the candidate identity is already linked to the existing user or another user, `linkIdentity()` will fail.

- If `linkIdentity` is run in the browser, the user is automatically redirected to the returned URL. On the server, you should handle the redirect.

## Parameters

- credentialsOne of the following options
- Option 1SignInWithOAuthCredentials

- Option 2SignInWithIdTokenCredentials

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.linkIdentity({
  provider: 'github'
})
```
