`signInAnonymously(credentials?)`

Creates a new anonymous user.

- Returns an anonymous user

- It is recommended to set up captcha for anonymous sign-ins to prevent abuse. You can pass in the captcha token in the `options` param.

## Parameters

- credentialsOptionalSignInAnonymouslyCredentials

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.signInAnonymously({
  options: {
    captchaToken
  }
});
```
