`generate(params?)`

Generates the user's set of recovery codes. The plaintext codes are returned exactly once in the response and cannot be retrieved again, so show them to the user and ask them to store the codes safely.

Requires `auth.experimental.recoveryCodes: true`.

- The session must be at `aal2` (verify another factor first), otherwise an error with code `insufficient_aal` is returned.

- The user must already have another verified factor (for example a TOTP factor): recovery codes can never be the only factor. Otherwise an error with code `mfa_recovery_codes_sole_factor` is returned.

- A user can only have one set of recovery codes. If one already exists, an error with code `mfa_verified_factor_exists` is returned; use `mfa.recoveryCodes.regenerate()` to replace it.

- The codes are returned in canonical form (lowercase, no separators). For display you can group them, for example in blocks of four characters. Avoid logging them to the console.

- Returns an error with code `mfa_recovery_codes_enroll_not_enabled` when recovery codes are disabled on the server.

## Parameters

- paramsOptionalMFARecoveryCodesGenerateParams

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { experimental: { recoveryCodes: true } },
})

const { data, error } = await supabase.auth.mfa.recoveryCodes.generate({
  friendlyName: 'Backup codes',
})

// Show the codes once, for example grouped in blocks of four characters
const formatted = data.codes.map((code) => code.match(/.{1,4}/g).join('-'))
```
