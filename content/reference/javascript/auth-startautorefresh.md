`startAutoRefresh()`

Starts an auto-refresh process in the background. The session is checked every few seconds. Close to the time of expiration a process is started to refresh the session. If refreshing fails it will be retried for as long as necessary.

If you set the GoTrueClientOptions#autoRefreshToken you don't need to call this function, it will be called for you.

On browsers the refresh process works only when the tab/window is in the foreground to conserve resources as well as prevent race conditions and flooding auth with requests. If you call this method any managed visibility change callback will be removed and you must manage visibility changes on your own.

On non-browser platforms the refresh process works continuously in the background, which may not be desirable. You should hook into your platform's foreground indication mechanism and call these methods appropriately to conserve resources.

GoTrueClient.stopAutoRefresh

- Only useful in non-browser environments such as React Native or Electron.

- The Supabase Auth library automatically starts and stops proactively refreshing the session when a tab is focused or not.

- On non-browser platforms, such as mobile or desktop apps built with web technologies, the library is not able to effectively determine whether the application is focused or not.

- To give this hint to the application, you should be calling this method when the app is in focus and calling `supabase.auth.stopAutoRefresh()` when it's out of focus.

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
