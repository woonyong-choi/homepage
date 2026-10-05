`resetPasswordForEmail(email, options)`

Sends a password reset request to an email address. This method supports the PKCE flow.

- The password reset flow consist of 2 broad steps: (i) Allow the user to login via the password reset link; (ii) Update the user's password.

- The `resetPasswordForEmail()` only sends a password reset link to the user's email. To update the user's password, see [`updateUser()`](#/reference/javascript/auth-updateuser).

- A `PASSWORD_RECOVERY` event will be emitted when the password recovery link is clicked. You can use [`onAuthStateChange()`](#/reference/javascript/auth-onauthstatechange) to listen and invoke a callback function on these events.

- When the user clicks the reset link in the email they are redirected back to your application. You can configure the URL that the user is redirected to with the `redirectTo` parameter. See [redirect URLs and wildcards](https://supabase.com/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls) to add additional redirect URLs to your project.

- After the user has been redirected successfully, prompt them for a new password and call `updateUser()`:

```typescript
const { data, error } = await supabase.auth.updateUser({
  password: new_password
})
```

## Parameters

- emailstring

The email address of the user.

- optionsobject

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://example.com/update-password',
})
```
