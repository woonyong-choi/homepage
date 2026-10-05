`unenroll(params)`

Unenroll removes a MFA factor. A user has to have an `aal2` authenticator level in order to unenroll a `verified` factor.

## Parameters

- paramsMFAUnenrollParams

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.mfa.unenroll({
  factorId: '34e770dd-9ff9-416c-87fa-43b31d7ef225',
})
```
