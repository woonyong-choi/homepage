`dispose()`

Tears down the client's background work: stops the auto-refresh interval, removes the `visibilitychange` listener, closes the cross-tab `BroadcastChannel`, and clears registered `onAuthStateChange` subscribers.

Call this from cleanup hooks when the client is being replaced before its JS realm is destroyed. React Strict Mode and HMR are the common cases. Any in-flight `fetch` calls continue to completion and may still write to storage; dispose doesn't abort them or erase storage.

Lifecycle caveat: because in-flight refreshes are not aborted, a disposed instance can still persist a rotated session to storage after `dispose()` returns. A subsequent `createClient` against the same `storageKey` will pick up that session on its next read. If you need strict isolation between client lifecycles, await any pending auth operation before calling `dispose()` (or change the `storageKey` for the replacement client).

Safe to call repeatedly.

## Return Type

Promise<void>

```typescript
useEffect(() => {
  const client = createClient(...)
  return () => { client.auth.dispose() }
}, [])
```
