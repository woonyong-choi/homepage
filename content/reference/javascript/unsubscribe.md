`unsubscribe(timeout)`

Leaves the channel.

Unsubscribes from server events, and instructs channel to terminate on server. Triggers onClose() hooks.

To receive leave acknowledgements, use the a `receive` hook to bind to the server ack, ie: channel.unsubscribe().receive("ok", () => alert("left!") )

## Parameters

- timeoutnumber

## Return Type

Promise<One of the following options>
- Option 1"ok"

- Option 2"timed out"

- Option 3"error"

- Option 4
