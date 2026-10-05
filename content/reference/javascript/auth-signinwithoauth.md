`signInWithOAuth(credentials)`

Log in an existing user via a third-party provider. This method supports the PKCE flow.

- This method is used for signing in using [Social Login (OAuth) providers](https://supabase.com/docs/guides/auth#configure-third-party-providers).

- It works by redirecting your application to the provider's authorization screen, before bringing back the user to your app.

## Parameters

- credentialsSignInWithOAuthCredentials

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github'
})
```
