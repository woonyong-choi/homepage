`regenerate()`

Replaces the user's recovery codes with a brand new set. All remaining codes from the previous set stop working immediately. The new plaintext codes are returned exactly once.

Requires `auth.experimental.recoveryCodes: true`.

- The session must be at `aal2`, otherwise an error with code `insufficient_aal` is returned.

- The factor `id` and `friendly_name` are preserved; only the codes change.

- Also clears any verification lockout on the recovery codes.

- Returns an error with code `mfa_factor_not_found` when the user has no recovery codes to regenerate; use `mfa.recoveryCodes.generate()` instead.

- Returns an error with code `mfa_recovery_codes_enroll_not_enabled` when recovery codes are disabled on the server.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.mfa.recoveryCodes.regenerate()
```
