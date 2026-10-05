## Introduction

The Swift client lets an application call Supabase services using its project URL and publishable key. Select the package and initialization method documented for the SDK version you use.

### Example

Initialize a Swift client with the project URL and publishable key.

```swift
let supabase = SupabaseClient(
  supabaseURL: URL(string: projectUrl)!,
  supabaseKey: publishableKey
)
```

## Install and initialize

Use **Supabase Swift client** for Swift. Initialize a client in the app and keep sign-in state in the application lifecycle. Keep secret keys on trusted servers only.

## Make a first request

Create a table with an appropriate read policy, then query it through the client. Handle errors and empty results explicitly. Authentication, Storage, and Realtime operations use the same project configuration.

## Continue

Start with [Database](#/guides/database) and [Auth](#/guides/auth), then consult the official reference for complete method signatures.

[View the official Swift documentation](https://supabase.com/docs/reference/swift/introduction).
