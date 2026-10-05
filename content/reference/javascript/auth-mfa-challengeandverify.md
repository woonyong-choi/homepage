`challengeAndVerify(params)`

Helper method which creates a challenge and immediately uses the given code to verify against it thereafter. The verification code is provided by the user by entering a code seen in their authenticator app.

- Intended for use with only TOTP factors.

- An [enrolled factor](#/reference/javascript/auth-mfa-enroll) is required before invoking `challengeAndVerify()`.

- Executes [`mfa.challenge()`](#/reference/javascript/auth-mfa-challenge) and [`mfa.verify()`](#/reference/javascript/auth-mfa-verify) in a single step.

## Parameters

- paramsMFAChallengeAndVerifyTOTPParams

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.mfa.challengeAndVerify({
  factorId: '34e770dd-9ff9-416c-87fa-43b31d7ef225',
  code: '123456'
})
```
