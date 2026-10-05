`onAuthStateChange(callback)`

Receive a notification every time an auth event happens. Safe to use without an async function as callback.

- Subscribes to important events occurring on the user's session.

- Use on the frontend/client. It is less useful on the server.

- Events are emitted across tabs to keep your application's UI up-to-date. Some events can fire very frequently, based on the number of tabs open. Use a quick and efficient callback function, and defer or debounce as many operations as you can to be performed outside of the callback.

- Callbacks can be `async` and can safely call other Supabase auth methods (`getUser`, `setSession`, etc.) from inside the callback.

- Keep callbacks quick. Events are awaited in order, so a slow callback delays subsequent events to subscribers in this tab.

- Emitted events:

- `INITIAL_SESSION`

- Emitted right after the Supabase client is constructed and the initial session from storage is loaded.

- `SIGNED_IN`

- Emitted each time a user session is confirmed or re-established, including on user sign in and when refocusing a tab.

- Avoid making assumptions as to when this event is fired, this may occur even when the user is already signed in. Instead, check the user object attached to the event to see if a new user has signed in and update your application's UI.

- This event can fire very frequently depending on the number of tabs open in your application.

- `SIGNED_OUT`

- Emitted when the user signs out. This can be after:

- A call to `supabase.auth.signOut()`.

- After the user's session has expired for any reason:

- User has signed out on another device.

- The session has reached its timebox limit or inactivity timeout.

- User has signed in on another device with single session per user enabled.

- Check the [User Sessions](https://supabase.com/docs/guides/auth/sessions) docs for more information.

- Use this to clean up any local storage your application has associated with the user.

- `TOKEN_REFRESHED`

- Emitted each time a new access and refresh token are fetched for the signed in user.

- It's best practice and highly recommended to extract the access token (JWT) and store it in memory for further use in your application.

- Avoid frequent calls to `supabase.auth.getSession()` for the same purpose.

- There is a background process that keeps track of when the session should be refreshed so you will always receive valid tokens by listening to this event.

- The frequency of this event is related to the JWT expiry limit configured on your project.

- `USER_UPDATED`

- Emitted each time the `supabase.auth.updateUser()` method finishes successfully. Listen to it to update your application's UI based on new profile information.

- `PASSWORD_RECOVERY`

- Emitted instead of the `SIGNED_IN` event when the user lands on a page that includes a password recovery link in the URL.

- Use it to show a UI to the user where they can [reset their password](https://supabase.com/docs/guides/auth/passwords#resetting-a-users-password-forgot-password).

## Parameters

- callbackfunction

A callback function to be invoked when an auth event happens.

## Return Type

object

```typescript
const { data } = supabase.auth.onAuthStateChange((event, session) => {
  console.log(event, session)

  if (event === 'INITIAL_SESSION') {
    // handle initial session
  } else if (event === 'SIGNED_IN') {
    // handle sign in event
  } else if (event === 'SIGNED_OUT') {
    // handle sign out event
  } else if (event === 'PASSWORD_RECOVERY') {
    // handle password recovery event
  } else if (event === 'TOKEN_REFRESHED') {
    // handle token refreshed event
  } else if (event === 'USER_UPDATED') {
    // handle user updated event
  }
})

// call unsubscribe to remove the callback
data.subscription.unsubscribe()
```
