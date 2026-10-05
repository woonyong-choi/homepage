`initialize()`

Initialize the auth client by loading the session from storage or detecting it from the URL after an OAuth, magic-link, or password-recovery redirect.

**Most callers do not need to invoke this directly.** The client calls it automatically during construction, and to react to sign-in events (including post-redirect events) you should subscribe to `onAuthStateChange` rather than awaiting `initialize()`.

You only need to call it manually when you have opted out of the automatic call by passing `skipAutoInitialize: true` — for example, in an SSR context where you need to control initialization timing. In that case, awaiting `initialize()` returns the resolved session result (or any error encountered while detecting it from the URL).

## Return Type

Promise<InitializeResult>
