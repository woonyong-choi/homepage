`getUserById(uid)`

Get user by id.

- Fetches the user object from the database based on the user's id.

- The `getUserById()` method requires the user's id which maps to the `auth.users.id` column.

## Parameters

- uidstring

The user's unique identifier

This function should only be called on a server. Never expose your `service_role` key in the browser.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.admin.getUserById(1)
```
