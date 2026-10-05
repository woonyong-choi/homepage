`generateLink(params)`

Generates email links and OTPs to be sent via a custom email provider.

- The following types can be passed into `generateLink()`: `signup`, `magiclink`, `invite`, `recovery`, `email_change_current`, `email_change_new`, `phone_change`.

- `generateLink()` only generates the email link for `email_change_email` if the **Secure email change** is enabled in your project's [email auth provider settings](https://supabase.com/dashboard/project/_/auth/providers).

- `generateLink()` handles the creation of the user for `signup`, `invite` and `magiclink`.

## Parameters

- paramsOne of the following options

The parameters for generating the link, including the link `type`, the user's `email`, and type-specific options such as `password`, `data`, and `redirectTo`.

- Option 1GenerateSignupLinkParams

- Option 2GenerateInviteOrMagiclinkParams

- Option 3GenerateRecoveryLinkParams

- Option 4GenerateEmailChangeLinkParams

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.admin.generateLink({
  type: 'signup',
  email: 'email@example.com',
  password: 'secret'
})
```
