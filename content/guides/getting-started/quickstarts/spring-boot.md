## 1. Create a Supabase project

Create a project in the Supabase Dashboard. Copy the project URL and publishable key from the Connect panel. These values identify the project; never place a secret or service-role key in a public client.

### Example

Use server-side configuration for a Spring Boot database connection; substitute the connection details from the project.

```properties
spring.datasource.url=jdbc:postgresql://DB_HOST:5432/postgres
spring.datasource.username=DB_USER
spring.datasource.password=DB_PASSWORD
```

## 2. Prepare Spring Boot

Create a Spring Boot service and choose a server-side integration appropriate for your database and API needs.

## 3. Connect the application

Add the project URL and publishable key to the application's environment configuration. Initialize one reusable Supabase client. Keep any privileged operation on a trusted server and apply Row Level Security to browser-accessible tables.

## 4. Read sample data

Create a small table in the SQL Editor, allow the intended role to read it with a policy, then query that table from Spring Boot. Show loading, empty, and error states as well as the returned rows.

## Continue

Review [Database](#/guides/database), [Auth](#/guides/auth), and [Storage](#/guides/storage) when extending the application.

[View the official Spring Boot documentation](https://supabase.com/docs/guides/getting-started/quickstarts/spring-boot).
