`presenceState()`

Returns the current presence state for this channel.

The shape is a map keyed by presence key (for example a user id) where each entry contains the tracked metadata for that user.

## Return Type

{ [key: string]: Array<Presence> }
