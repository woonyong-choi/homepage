`enroll(params)`

Starts the enrollment process for a new Multi-Factor Authentication (MFA) factor. This method creates a new `unverified` factor. To verify a factor, present the QR code or secret to the user and ask them to add it to their authenticator app. The user has to enter the code from their authenticator app to verify it.

Upon verifying a factor, all other sessions are logged out and the current session's authenticator level is promoted to `aal2`.

- Use `totp` or `phone` as the `factorType` and use the returned `id` to create a challenge.

- To create a challenge, see [`mfa.challenge()`](#/reference/javascript/auth-mfa-challenge).

- To verify a challenge, see [`mfa.verify()`](#/reference/javascript/auth-mfa-verify).

- To create and verify a TOTP challenge in a single step, see [`mfa.challengeAndVerify()`](#/reference/javascript/auth-mfa-challengeandverify).

- To generate a QR code for the `totp` secret in Next.js, you can do the following:

```typescript
<Image src={data.totp.qr_code} alt={data.totp.uri} layout="fill"></Image>
```

- The `challenge` and `verify` steps are separated when using Phone factors as the user will need time to receive and input the code obtained from the SMS in challenge.

## Parameters

- paramsOne of the following options
- Option 1MFAEnrollTOTPParams

- Option 2MFAEnrollPhoneParams

- Option 3MFAEnrollParamsBase

- Option 4MFAEnrollWebauthnParams

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'your_friendly_name'
})

// Use the id to create a challenge.
// The challenge can be verified by entering the code generated from the authenticator app.
// The code will be generated upon scanning the qr_code or entering the secret into the authenticator app.
const { id, type, totp: { qr_code, secret, uri }, friendly_name } = data
const challenge = await supabase.auth.mfa.challenge({ factorId: id });
```
