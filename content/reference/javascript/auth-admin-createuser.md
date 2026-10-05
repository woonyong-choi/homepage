`createUser(attributes)`

Creates a new user. This function should only be called on a server. Never expose your `service_role` key in the browser.

- To confirm the user's email address or phone number, set `email_confirm` or `phone_confirm` to true. Both arguments default to false.

- `createUser()` will not send a confirmation email to the user. You can use [`inviteUserByEmail()`](#/reference/javascript/auth-admin-inviteuserbyemail) if you want to send them an email invite instead.

- If you are sure that the created user's email or phone number is legitimate and verified, you can set the `email_confirm` or `phone_confirm` param to `true`.

## Parameters

- attributesAdminUserAttributes

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.admin.createUser({
  email: 'user@email.com',
  password: 'password',
  user_metadata: { name: 'Yoda' }
})
```
