`getAuthorizationDetails(authorizationId)`

Retrieves details about an OAuth authorization request. Used to display consent information to the user. Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.

This method returns one of two response types:

- `OAuthAuthorizationDetails`: User needs to consent - show consent page with client info

- `OAuthRedirect`: User already consented - redirect immediately to the OAuth client

Use type narrowing to distinguish between the responses:

```typescript
if ('authorization_id' in data) {
  // Show consent page
} else {
  // Redirect to data.redirect_url
}
```

## Parameters

- authorizationIdstring

The authorization ID from the authorization request

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object
