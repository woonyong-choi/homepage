`resend(credentials)`

Resends an existing signup confirmation email, email change email, SMS OTP or phone change OTP.

- Resends a signup confirmation, email change or phone change email to the user.

- Passwordless sign-ins can be resent by calling the `signInWithOtp()` method again.

- Password recovery emails can be resent by calling the `resetPasswordForEmail()` method again.

- This method will only resend an email or phone OTP to the user if there was an initial signup, email change or phone change request being made(note: For existing users signing in with OTP, you should use `signInWithOtp()` again to resend the OTP).

- You can specify a redirect url when you resend an email link using the `emailRedirectTo` option.

## Parameters

- credentialsOne of the following options
- Option 1object

- Option 2object

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { error } = await supabase.auth.resend({
  type: 'signup',
  email: 'email@example.com',
  options: {
    emailRedirectTo: 'https://example.com/welcome'
  }
})
```
