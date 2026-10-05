`httpSend(event, payload, opts)`

Sends a broadcast message explicitly via REST API.

This method always uses the REST API endpoint regardless of WebSocket connection state. Useful when you want to guarantee REST delivery or when gradually migrating from implicit REST fallback.

Payloads that are `ArrayBuffer` or `ArrayBufferView` (e.g. `Uint8Array`) are sent as `application/octet-stream`; all other payloads are JSON-encoded.

## Parameters

- eventstring

The name of the broadcast event

- payloadany

Payload to be sent (required)

- optsobject

Options including timeout

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object
