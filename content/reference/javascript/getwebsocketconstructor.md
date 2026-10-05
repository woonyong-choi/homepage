`getWebSocketConstructor()`

Returns the best available WebSocket constructor for the current runtime.

## Return Type

function

```typescript
try {
  const WS = WebSocketFactory.getWebSocketConstructor()
  const socket = new WS('wss://example.com/socket')
} catch (error) {
  console.error('WebSocket not available in this environment.', error)
}
```
