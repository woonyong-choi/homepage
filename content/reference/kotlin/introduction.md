## Introduction

The Kotlin client lets an application call Supabase services using its project URL and publishable key. Select the package and initialization method documented for the SDK version you use.

### Example

Install the Postgrest module when the Kotlin app needs database access.

```kotlin
val supabase = createSupabaseClient(
    supabaseUrl = projectUrl,
    supabaseKey = publishableKey
) {
    install(Postgrest)
}
```

## Install and initialize

Use **Supabase Kotlin client** for Kotlin. Initialize the Kotlin client in a shared module and add only the modules your application needs. Keep secret keys on trusted servers only.

## Make a first request

Create a table with an appropriate read policy, then query it through the client. Handle errors and empty results explicitly. Authentication, Storage, and Realtime operations use the same project configuration.

## Continue

Start with [Database](#/guides/database) and [Auth](#/guides/auth), then consult the official reference for complete method signatures.

[View the official Kotlin documentation](https://supabase.com/docs/reference/kotlin/introduction).
