`listFactors(params)`

Lists all factors associated to a user.

## Parameters

- paramsAuthMFAAdminListFactorsParams

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.admin.mfa.listFactors()
```
