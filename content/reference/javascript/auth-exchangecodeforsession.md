`exchangeCodeForSession(authCode, options?)`

Log in an existing user by exchanging an Auth Code issued during the PKCE flow.

- Used when `flowType` is set to `pkce` in client options.

- When several PKCE flows are in flight at once, pass `options.flowId` so the code is exchanged with the verifier created by that specific flow. The flow id is returned by `signInWithOAuth`, and with `experimental.appendPkceFlowIdToRedirects` enabled it also arrives on your callback URL as the reserved `sb_flow_id` query parameter (read automatically in a browser).

- When a flow id is present but its stored verifier is gone (evicted, already used, or from another device), the call fails with a verifier missing error instead of trying another flow's verifier — a mismatched verifier would consume the single-use code. Without any flow id the most recently stored verifier is used, as before.

## Parameters

- authCodestring

- optionsOptionalobject

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
supabase.auth.exchangeCodeForSession('34e770dd-9ff9-416c-87fa-43b31d7ef225')
```
