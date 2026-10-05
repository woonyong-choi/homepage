`channel(topic, params)`

Creates (or reuses) a RealtimeChannel for the provided topic.

Topics are automatically prefixed with `realtime:` to match the Realtime service. If a channel with the same topic already exists it will be returned instead of creating a duplicate connection.

## Parameters

- topicstring

- paramsRealtimeChannelOptions
