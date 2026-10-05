`setSession(currentSession)`

Sets the session data from the current session. If the current session is expired, setSession will take care of refreshing it to obtain a new session. If the refresh token or access token in the current session is invalid, an error will be thrown.

- This method sets the session using an `access_token` and `refresh_token`.

- If successful, a `SIGNED_IN` event is emitted.

## Parameters

- currentSessionobject

The current session that minimally contains an access token and refresh token.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token
  })
```
