`challenge(params)`

Prepares a challenge used to verify that a user has access to a MFA factor.

- An [enrolled factor](#/reference/javascript/auth-mfa-enroll) is required before creating a challenge.

- To verify a challenge, see [`mfa.verify()`](#/reference/javascript/auth-mfa-verify).

- A phone factor sends a code to the user upon challenge. The channel defaults to `sms` unless otherwise specified.

## Parameters

- paramsOne of the following options
- Option 1MFAChallengeParamsBase

- Option 2MFAChallengePhoneParams

- Option 3MFAChallengeWebauthnParams

- Option 4MFAChallengeTOTPParams

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.mfa.challenge({
  factorId: '34e770dd-9ff9-416c-87fa-43b31d7ef225'
})
```
