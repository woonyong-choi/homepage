`track(payload, opts)`

Sends the supplied payload to the presence tracker so other subscribers can see that this client is online. Use `untrack` to stop broadcasting presence for the same key.

Tracking makes this client visible to other subscribers immediately, regardless of this channel's `config.presence.enabled` setting or whether it has a `presence` listener — that flag only affects whether this client receives presence updates from others (and, on RLS-protected channels, whether it's authorized to do so).

## Parameters

- payload{ [key: string]: any }

- opts{ [key: string]: any }

## Return Type

Promise<One of the following options>
- Option 1"ok"

- Option 2"timed out"

- Option 3"error"

- Option 4
