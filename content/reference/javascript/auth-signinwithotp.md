`signInWithOtp(credentials)`

Log in a user using magiclink or a one-time password (OTP).

If the `{{ .ConfirmationURL }}` variable is specified in the email template, a magiclink will be sent. If the `{{ .Token }}` variable is specified in the email template, an OTP will be sent. If you're using phone sign-ins, only an OTP will be sent. You won't be able to send a magiclink for phone sign-ins.

Be aware that you may get back an error message that will not distinguish between the cases where the account does not exist or, that the account can only be accessed via social login.

Do note that you will need to configure a Whatsapp sender on Twilio if you are using phone sign in with the 'whatsapp' channel. The whatsapp channel is not supported on other providers at this time. This method supports PKCE when an email is passed.

- Requires either an email or phone number.

- This method is used for passwordless sign-ins where a OTP is sent to the user's email or phone number.

- If the user doesn't exist, `signInWithOtp()` will signup the user instead. To restrict this behavior, you can set `shouldCreateUser` in `SignInWithPasswordlessCredentials.options` to `false`.

- If you're using an email, you can configure whether you want the user to receive a magiclink or a OTP.

- If you're using phone, you can configure whether you want the user to receive a OTP.

- The magic link's destination URL is determined by the [`SITE_URL`](https://supabase.com/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls).

- See [redirect URLs and wildcards](https://supabase.com/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls) to add additional redirect URLs to your project.

- Magic links and OTPs share the same implementation. To send users a one-time code instead of a magic link, [modify the magic link email template](https://supabase.com/dashboard/project/_/auth/templates) to include `{{ .Token }}` instead of `{{ .ConfirmationURL }}`.

- See our [Twilio Phone Auth Guide](https://supabase.com/docs/guides/auth/phone-login?showSMSProvider=Twilio) for details about configuring WhatsApp sign in.

## Parameters

- credentialsOne of the following options
- Option 1object

- Option 2object

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'example@email.com',
  options: {
    emailRedirectTo: 'https://example.com/welcome'
  }
})
```
