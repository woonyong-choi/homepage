`unenroll()`

Removes the user's recovery codes factor together with all of its codes.

Requires `auth.experimental.recoveryCodes: true`.

- The session must be at `aal2`, otherwise an error with code `insufficient_aal` is returned.

- Returns an error with code `mfa_factor_not_found` when the user has no recovery codes.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.mfa.recoveryCodes.unenroll()
```
