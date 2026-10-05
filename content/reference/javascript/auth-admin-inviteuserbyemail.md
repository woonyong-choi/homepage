`inviteUserByEmail(email, options)`

Sends an invite link to an email address.

- Sends an invite link to the user's email address.

- The `inviteUserByEmail()` method is typically used by administrators to invite users to join the application.

- Note that PKCE is not supported when using `inviteUserByEmail`. This is because the browser initiating the invite is often different from the browser accepting the invite which makes it difficult to provide the security guarantees required of the PKCE flow.

## Parameters

- emailstring

The email address of the user.

- optionsobject

Additional options to be included when inviting.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.admin.inviteUserByEmail('email@example.com')
```
