`getUser(jwt?)`

Gets the current user details if there is an existing session. This method performs a network request to the Supabase Auth server, so the returned value is authentic and can be used to base authorization rules on.

- This method fetches the user object from the database instead of local session.

- This method is useful for checking if the user is authorized because it validates the user's access token JWT on the server.

- Should always be used when checking for user authorization on the server. On the client, you can instead use `getSession().session.user` for faster results. `getSession` is insecure on the server.

## Parameters

- jwtOptionalstring

Takes in an optional access token JWT. If no JWT is provided, the JWT from the current session is used.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data: { user } } = await supabase.auth.getUser()
```
