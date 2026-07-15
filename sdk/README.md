# @zcashme/login

The official JavaScript/TypeScript SDK for ZcashMe Authentication.

This SDK provides a lightweight OpenID Connect (OIDC) client for integrating `auth.zcash.me` into your own applications. It securely handles generating authorization URLs, managing redirects, exchanging authorization codes for tokens, and fetching user profiles.

## Installation

```bash
npm install @zcashme/login
# or
pnpm add @zcashme/login
# or
yarn add @zcashme/login
```

## Quick Start

### 1. Initialize the Client

```typescript
import { ZcashMeClient } from '@zcashme/login';

const authClient = new ZcashMeClient({
  clientId: 'your_client_id',
  redirectUri: 'http://localhost:3000/callback',
});
```

### 2. Initiate Login (Redirect to ZcashMe)

When the user clicks "Login", redirect them to the ZcashMe authorization screen:

```typescript
// In a browser environment, this will automatically redirect the window
authClient.loginWithRedirect();

// OR get the URL to handle the redirect manually:
const url = authClient.getAuthorizationUrl();
```

### 3. Handle the Callback

After the user approves the login, they will be redirected back to your `redirectUri` with a `code` in the URL parameters. Pass this code to the SDK to exchange it for access tokens.

```typescript
// Example: grabbing the code from the URL on your /callback route
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
  try {
    const tokens = await authClient.handleCallback(code);
    console.log("Access Token:", tokens.access_token);
    console.log("ID Token:", tokens.id_token);
    
    // You can now fetch the user's profile
    const userProfile = await authClient.getUserInfo(tokens.access_token);
    console.log("Logged in user:", userProfile);
  } catch (err) {
    console.error("Login failed", err);
  }
}
```

## Advanced Configuration

You can override the default ZcashMe endpoints if needed (e.g. for local testing during development):

```typescript
const customClient = new ZcashMeClient({
  clientId: 'your_client_id',
  redirectUri: 'http://localhost:3000/callback',
  authorizationEndpoint: 'http://localhost:4000/authorize',
  tokenEndpoint: 'http://localhost:4000/token',
  userinfoEndpoint: 'http://localhost:4000/userinfo',
  scopes: ['openid', 'profile', 'email', 'custom_scope']
});
```
