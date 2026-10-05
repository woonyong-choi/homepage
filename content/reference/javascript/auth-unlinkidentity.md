`unlinkIdentity(identity)`

Unlinks an identity from a user by deleting it. The user will no longer be able to sign in with that identity once it's unlinked.

- The **Enable Manual Linking** option must be enabled from your [project's authentication settings](https://supabase.com/dashboard/project/_/auth/providers).

- The user needs to be signed in to call `unlinkIdentity()`.

- The user must have at least 2 identities in order to unlink an identity.

- The identity to be unlinked must belong to the user.

## Parameters

- identityUserIdentity

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
// retrieve all identities linked to a user
const identities = await supabase.auth.getUserIdentities()

// find the google identity
const googleIdentity = identities.find(
  identity => identity.provider === 'google'
)

// unlink the google identity
const { error } = await supabase.auth.unlinkIdentity(googleIdentity)
```
