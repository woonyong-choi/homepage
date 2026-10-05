`setAuth(token)`

Sets the JWT access token used for channel subscription authorization and Realtime RLS.

If param is null it will use the `accessToken` callback function or the token set on the client.

On callback used, it will set the value of the token internal to the client.

When a token is explicitly provided AND no `accessToken` callback is configured, it will be preserved across channel operations (including removeChannel and resubscribe) and the client stays in manual-token mode.

When an `accessToken` callback IS configured, the callback is the source of truth: the client remains in callback mode and continues to refresh from it on heartbeat, even after a bootstrap/override `setAuth(token)` call.

The callback is called on connect and on every heartbeat (`heartbeatIntervalMs`, default 25000ms). Its token must stay valid past the next call, or the server closes the channel at expiry with no automatic resubscribe.

## Parameters

- tokenOne of the following options

A JWT string to override the token set on the client.

- Option 1null

- Option 2string

## Return Type

Promise<void>

```typescript
Setting the authorization header
// Use a manual token (preserved across resubscribes when no accessToken callback is set)
client.realtime.setAuth('my-custom-jwt')

// Switch back to using the accessToken callback
client.realtime.setAuth()
```
