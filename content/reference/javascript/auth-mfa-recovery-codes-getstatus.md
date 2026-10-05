`getStatus()`

Returns the enrollment status of the user's recovery codes: the total number of codes in the current set and how many are still unused. Never returns the codes themselves.

Requires `auth.experimental.recoveryCodes: true`.

- Works at any authenticator assurance level (`aal1` or `aal2`).

- Returns an error with code `mfa_factor_not_found` when the user has not generated recovery codes yet.

- `remaining` can be `0` once every code has been used; prompt the user to call `mfa.recoveryCodes.regenerate()`.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.mfa.recoveryCodes.getStatus()
```
