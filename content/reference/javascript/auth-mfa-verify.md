`verify(params)`

Verifies a code against a challenge. The verification code is provided by the user by entering a code seen in their authenticator app.

- To verify a challenge, please [create a challenge](#/reference/javascript/auth-mfa-challenge) first.

## Parameters

- paramsOne of the following options
- Option 1MFAVerifyTOTPParams

- Option 2MFAVerifyPhoneParams

- Option 3MFAVerifyWebauthnParams

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.mfa.verify({
  factorId: '34e770dd-9ff9-416c-87fa-43b31d7ef225',
  challengeId: '4034ae6f-a8ce-4fb5-8ee5-69a5863a7c15',
  code: '123456'
})
```
