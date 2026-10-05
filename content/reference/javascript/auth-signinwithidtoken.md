`signInWithIdToken(credentials)`

Allows signing in with an OIDC ID token. The authentication provider used should be enabled and configured.

- Use an ID token to sign in.

- Especially useful when implementing sign in using native platform dialogs in mobile or desktop apps using Sign in with Apple or Sign in with Google on iOS and Android.

- You can also use Google's [One Tap](https://developers.google.com/identity/gsi/web/guides/display-google-one-tap) and [Automatic sign-in](https://developers.google.com/identity/gsi/web/guides/automatic-sign-in-sign-out) via this API.

## Parameters

- credentialsSignInWithIdTokenCredentials

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.signInWithIdToken({
  provider: 'google',
  token: 'your-id-token'
})
```
