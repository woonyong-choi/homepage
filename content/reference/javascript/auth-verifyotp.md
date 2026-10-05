`verifyOtp(params)`

Log in a user given a User supplied OTP or TokenHash received through mobile or email.

- The `verifyOtp` method takes in different verification types.

- If a phone number is used, the type can either be:

- `sms` – Used when verifying a one-time password (OTP) sent via SMS during sign-up or sign-in.

- `phone_change` – Used when verifying an OTP sent to a new phone number during a phone number update process.

- If an email address is used, the type can be one of the following (note: `signup` and `magiclink` types are deprecated):

- `email` – Used when verifying an OTP sent to the user's email during sign-up or sign-in.

- `recovery` – Used when verifying an OTP sent for account recovery, typically after a password reset request.

- `invite` – Used when verifying an OTP sent as part of an invitation to join a project or organization.

- `email_change` – Used when verifying an OTP sent to a new email address during an email update process.

- The verification type used should be determined based on the corresponding auth method called before `verifyOtp` to sign up / sign-in a user.

- The `TokenHash` is contained in the [email templates](https://supabase.com/docs/guides/auth/auth-email-templates) and can be used to sign in.  You may wish to use the hash for the PKCE flow for Server Side Auth. Read [the Password-based Auth guide](https://supabase.com/docs/guides/auth/passwords) for more details.

## Parameters

- paramsOne of the following options
- Option 1VerifyMobileOtpParams

- Option 2VerifyEmailOtpParams

- Option 3VerifyTokenHashParams

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email'})
```
