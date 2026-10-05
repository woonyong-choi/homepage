`getUserIdentities()`

Gets all the identities linked to a user.

- The user needs to be signed in to call `getUserIdentities()`.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.getUserIdentities()
```
