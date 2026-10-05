`isWebSocketSupported()`

Detects whether the runtime can establish WebSocket connections.

## Return Type

boolean

```typescript
if (!WebSocketFactory.isWebSocketSupported()) {
  console.error('WebSockets are required for this script.')
  process.exitCode = 1
}
```
