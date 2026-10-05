`signInWithSSO(params)`

Attempts a single-sign on using an enterprise Identity Provider. A successful SSO attempt will redirect the current page to the identity provider authorization page. The redirect URL is implementation and SSO protocol specific.

You can use it by providing a SSO domain. Typically you can extract this domain by asking users for their email address. If this domain is registered on the Auth instance the redirect will use that organization's currently active SSO Identity Provider for the login.

If you have built an organization-specific login page, you can use the organization's SSO Identity Provider UUID directly instead.

- Before you can call this method you need to [establish a connection](https://supabase.com/docs/guides/auth/sso/auth-sso-saml#managing-saml-20-connections) to an identity provider. Use the [CLI commands](https://supabase.com/docs/reference/cli/supabase-sso) to do this.

- If you've associated an email domain to the identity provider, you can use the `domain` property to start a sign-in flow.

- In case you need to use a different way to start the authentication flow with an identity provider, you can use the `providerId` property. For example:

- Mapping specific user email addresses with an identity provider.

- Using different hints to identity the identity provider to be used by the user, like a company-specific page, IP address or other tracking information.

## Parameters

- paramsOne of the following options
- Option 1object

- Option 2object

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
// You can extract the user's email domain and use it to trigger the
  // authentication flow with the correct identity provider.

  const { data, error } = await supabase.auth.signInWithSSO({
    domain: 'company.com'
  })

  if (data?.url) {
    // redirect the user to the identity provider's authentication flow
    window.location.href = data.url
  }
```
