## Introduction

The C# client lets an application call Supabase services using its project URL and publishable key. Select the package and initialization method documented for the SDK version you use.

### Example

Initialize the .NET client before using its database and authentication methods.

```csharp
var client = new Supabase.Client(projectUrl, publishableKey);
await client.InitializeAsync();
```

## Install and initialize

Use **Supabase C# client** for C#. Initialize a client in your .NET application and use models or responses appropriate to the SDK. Keep secret keys on trusted servers only.

## Make a first request

Create a table with an appropriate read policy, then query it through the client. Handle errors and empty results explicitly. Authentication, Storage, and Realtime operations use the same project configuration.

## Continue

Start with [Database](#/guides/database) and [Auth](#/guides/auth), then consult the official reference for complete method signatures.

[View the official C# documentation](https://supabase.com/docs/reference/csharp/introduction).
