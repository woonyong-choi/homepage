`signInWithWeb3(credentials)`

Signs in a user by verifying a message signed by the user's private key. Supports Ethereum (via Sign-In-With-Ethereum) & Solana (Sign-In-With-Solana) standards, both of which derive from the EIP-4361 standard With slight variation on Solana's side.

- Uses a Web3 (Ethereum, Solana) wallet to sign a user in.

- Read up on the [potential for abuse](https://supabase.com/docs/guides/auth/auth-web3#potential-for-abuse) before using it.

## Parameters

- credentialsOne of the following options
- Option 1One of the following options
- Option 1object

- Option 2object

- Option 2One of the following options
- Option 1object

- Option 2object

## Return Type

Promise<One of the following options>
- Option 1object

- Option 2object

```typescript
// uses window.ethereum for the wallet
  const { data, error } = await supabase.auth.signInWithWeb3({
    chain: 'ethereum',
    statement: 'I accept the Terms of Service at https://example.com/tos'
  })

  // uses window.solana for the wallet
  const { data, error } = await supabase.auth.signInWithWeb3({
    chain: 'solana',
    statement: 'I accept the Terms of Service at https://example.com/tos'
  })
```
