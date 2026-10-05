## Overview

Supabase Auth manages user identity and sessions. Applications can add email sign-in, passwordless flows, OAuth providers, and other supported methods.

### Example

Sign in with a client initialized for the current project; handle both the returned session and any error.

```js
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
```

## Access control

Authentication identifies a user. Database Row Level Security policies decide which rows that user may access. Design the two together.

## Continue

Connect [Auth](#/guides/auth) to [Database](#/guides/database) policies and [Storage](#/guides/storage) objects.

[Read the current official guide](https://supabase.com/docs/guides/auth).
