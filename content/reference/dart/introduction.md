## Introduction

The Flutter client lets an application call Supabase services using its project URL and publishable key. Select the package and initialization method documented for the SDK version you use.

### Example

Initialize the Flutter client before calling `runApp`.

```dart
await Supabase.initialize(
  url: projectUrl,
  anonKey: publishableKey,
);
```

## Install and initialize

Use **supabase_flutter** for Flutter. Initialize the Flutter SDK before running the app and access the client from widgets or application services. Keep secret keys on trusted servers only.

## Make a first request

Create a table with an appropriate read policy, then query it through the client. Handle errors and empty results explicitly. Authentication, Storage, and Realtime operations use the same project configuration.

## Continue

Start with [Database](#/guides/database) and [Auth](#/guides/auth), then consult the official reference for complete method signatures.

[View the official Flutter documentation](https://supabase.com/docs/reference/dart/introduction).
