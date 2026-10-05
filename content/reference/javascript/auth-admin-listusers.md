`listUsers(params?)`

Get a list of users.

This function should only be called on a server. Never expose your `service_role` key in the browser.

- Defaults to return 50 users per page.

## Parameters

- paramsOptionalPageParams

An object which supports `page` and `perPage` as numbers, to alter the paginated results.

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
const { data: { users }, error } = await supabase.auth.admin.listUsers()
```
