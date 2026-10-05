`stopAutoRefresh()`

Stops an active auto refresh process running in the background (if any).

If you call this method any managed visibility change callback will be removed and you must manage visibility changes on your own.

See GoTrueClient.startAutoRefresh for more details.

- Only useful in non-browser environments such as React Native or Electron.

- The Supabase Auth library automatically starts and stops proactively refreshing the session when a tab is focused or not.

- On non-browser platforms, such as mobile or desktop apps built with web technologies, the library is not able to effectively determine whether the application is focused or not.

- When your application goes in the background or out of focus, call this method to stop the proactive refreshing of the session.

## Return Type

Promise<void>

```typescript
import { AppState } from 'react-native'

// make sure you register this only once!
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
```
