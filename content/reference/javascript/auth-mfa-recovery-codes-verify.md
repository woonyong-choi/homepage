`verify(params)`

Verifies one of the user's recovery codes and upgrades the current session to `aal2`. Each code can be used only once.

Requires `auth.experimental.recoveryCodes: true`.

- On success the current session is upgraded to `aal2` in place and persisted, and the `MFA_CHALLENGE_VERIFIED` event is emitted. The user's other `aal1` sessions are signed out.

- The new access token includes `mfa/recovery_code` in its `amr` claim.

- The code can be passed exactly as the user typed it: letter case, whitespace and `-` separators are ignored.

- A wrong, already used, or missing code returns an error with code `mfa_verification_failed`.

- After too many failed attempts, verification is locked for a period and an error with code `mfa_recovery_codes_locked` (status `429`) is returned. Ask the user to wait or to use another factor.

- Returns an error with code `mfa_recovery_codes_verify_not_enabled` when recovery code verification is disabled on the server.

## Parameters

- paramsMFARecoveryCodesVerifyParams

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.mfa.recoveryCodes.verify({
  code: 'K4M9-X7QP-2AB8-HT3Z',
})
```
