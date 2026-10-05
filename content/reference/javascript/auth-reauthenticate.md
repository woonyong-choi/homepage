`reauthenticate()`

Sends a reauthentication OTP to the user's email or phone number. Requires the user to be signed-in.

- This method is used together with `updateUser()` when a user's password needs to be updated.

- If you require your user to reauthenticate before updating their password, you need to enable the **Secure password change** option in your [project's email provider settings](https://supabase.com/dashboard/project/_/auth/providers).

- A user is only require to reauthenticate before updating their password if **Secure password change** is enabled and the user **hasn't recently signed in**. A user is deemed recently signed in if the session was created in the last 24 hours.

- This method will send a nonce to the user's email. If the user doesn't have a confirmed email address, the method will send the nonce to the user's confirmed phone number instead.

- After receiving the OTP, include it as the `nonce` in your `updateUser()` call to finalize the password change.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { error } = await supabase.auth.reauthenticate()
```
