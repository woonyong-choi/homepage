## 1. Create a Supabase project

Create a project in the Supabase Dashboard. Copy the project URL and publishable key from the Connect panel. These values identify the project; never place a secret or service-role key in a public client.

### Example

Initialize the client with the database module used by the Android app.

```kotlin
val supabase = createSupabaseClient(
    supabaseUrl = projectUrl,
    supabaseKey = publishableKey
) {
    install(Postgrest)
}
```

## 2. Prepare Android Kotlin

Create an Android Kotlin application and initialize a client in a reusable module.

## 3. Connect the application

Add the project URL and publishable key to the application's environment configuration. Initialize one reusable Supabase client. Keep any privileged operation on a trusted server and apply Row Level Security to browser-accessible tables.

## 4. Read sample data

Create a small table in the SQL Editor, allow the intended role to read it with a policy, then query that table from Android Kotlin. Show loading, empty, and error states as well as the returned rows.

## Continue

Review [Database](#/guides/database), [Auth](#/guides/auth), and [Storage](#/guides/storage) when extending the application.

[View the official Android Kotlin documentation](https://supabase.com/docs/guides/getting-started/quickstarts/kotlin).
