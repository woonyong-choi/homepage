`refreshSession(currentSession?)`

Returns a new session, regardless of expiry status. Takes in an optional current session. If not passed in, then refreshSession() will attempt to retrieve it from getSession(). If the current session's refresh token is invalid, an error will be thrown.

- This method will refresh and return a new session whether the current one is expired or not.

## Parameters

- currentSessionOptionalobject

The current session. If passed in, it must contain a refresh token.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data, error } = await supabase.auth.refreshSession()
const { session, user } = data
```
