`signInWithPassword(credentials)`

Log in an existing user with an email and password or phone and password.

Be aware that you may get back an error message that will not distinguish between the cases where the account does not exist or that the email/phone and password combination is wrong or that the account can only be accessed via social login.

- Requires either an email and password or a phone number and password.

## Parameters

- credentialsSignInWithPasswordCredentials

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'example@email.com',
  password: 'example-password',
})
```
