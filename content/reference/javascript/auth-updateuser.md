`updateUser(attributes, options)`

Updates user data for a logged in user.

- In order to use the `updateUser()` method, the user needs to be signed in first.

- By default, email updates sends a confirmation link to both the user's current and new email. To only send a confirmation link to the user's new email, disable **Secure email change** in your project's [email auth provider settings](https://supabase.com/dashboard/project/_/auth/providers).

## Parameters

- attributesUserAttributes

- optionsobject

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.updateUser({
  email: 'new@email.com'
})
```
