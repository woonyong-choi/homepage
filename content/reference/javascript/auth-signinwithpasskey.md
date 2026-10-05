`signInWithPasskey(credentials?)`

Sign in with a passkey. Handles the full WebAuthn ceremony:

- Fetches authentication challenge from server

- Prompts user via navigator.credentials.get()

- Verifies credential with server and creates session

Pass `options.mediation: 'conditional'` to use WebAuthn Conditional UI (passkey autofill) instead of the modal picker; the value is forwarded to `navigator.credentials.get()` unchanged.

The challenge fetched in step 1 expires after the server's GOTRUE_WEBAUTHN_CHALLENGE_EXPIRY_DURATION (5 minutes by default). With `mediation: 'conditional'` the autofill prompt can stay pending for longer than that: the browser ceremony then still succeeds, but verification fails with `error_code: "webauthn_challenge_expired"`. Recover by calling `signInWithPasskey()` again. It fetches a fresh challenge and, unless you passed your own `options.signal`, cancels the pending ceremony first, so the browser never sees two concurrent WebAuthn requests; the earlier call resolves with a `WebAuthnError` whose code is `ERROR_CEREMONY_ABORTED`. If you pass your own `signal`, abort it before retrying.

## Parameters

- credentialsOptionalSignInWithPasskeyCredentials

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
// <input autocomplete="username webauthn" /> somewhere on the page
const { data, error } = await supabase.auth.signInWithPasskey({
  options: {
    mediation: 'conditional'
  }
});
```
