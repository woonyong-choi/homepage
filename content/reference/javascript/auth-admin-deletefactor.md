`deleteFactor(params)`

Deletes a factor on a user. This will log the user out of all active sessions if the deleted factor was verified.

## Parameters

- paramsAuthMFAAdminDeleteFactorParams

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.admin.mfa.deleteFactor({
  id: '34e770dd-9ff9-416c-87fa-43b31d7ef225',
  userId: 'a89baba7-b1b7-440f-b4bb-91026967f66b',
})
```
