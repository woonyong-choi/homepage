`updateUserById(uid, attributes)`

Updates the user data. Changes are applied directly without confirmation flows.

**Important:** This is a server-side operation and does **not** trigger client-side `onAuthStateChange` listeners. The admin API has no connection to client state.

To sync changes to the client after calling this method:

- On the client, call `supabase.auth.refreshSession()` to fetch the updated user data

- This will trigger the `TOKEN_REFRESHED` event and notify all listeners

## Parameters

- uidstring

The user's unique identifier

- attributesAdminUserAttributes

The data you want to update.

This function should only be called on a server. Never expose your `service_role` key in the browser.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
// Server-side (Edge Function)
const { data, error } = await supabase.auth.admin.updateUserById(
  userId,
  { user_metadata: { preferences: { theme: 'dark' } } }
)

// Client-side (to sync the changes)
const { data, error } = await supabase.auth.refreshSession()
// onAuthStateChange listeners will now be notified with updated user
```
