`deleteUser(id, shouldSoftDelete)`

Delete a user. Requires a `service_role` key.

- The `deleteUser()` method requires the user's ID, which maps to the `auth.users.id` column.

## Parameters

- idstring

The user id you want to remove.

- shouldSoftDeleteboolean

If true, then the user will be soft-deleted from the auth schema. Soft deletion allows user identification from the hashed user ID but is not reversible. Defaults to false for backward compatibility.

This function should only be called on a server. Never expose your `service_role` key in the browser.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.admin.deleteUser(
  '715ed5db-f090-4b8c-a067-640ecee36aa0'
)
```
