# ZcashMe Auth (`zns-login`)

Zcash-based authentication: pay to log in. A shielded Zcash payment proves identity — no password, no email, no third party.

This repository serves as a **Monorepo** for the ZcashMe Authentication ecosystem, containing the core Rust worker, a centralized OpenID Connect (OIDC) provider, a lightweight client SDK, and a production-grade demo app integration.

## Monorepo Layout

```text
zns-login/
├── rust/      # Rust worker (the core Zcash authentication backend)
├── auth/      # Centralized OIDC Provider (Next.js / Supabase)
├── sdk/       # TypeScript OIDC Client SDK (@zcashme/login)
└── demo/      # PGPZ Community demo app showcasing native NextAuth integration
```

---

## 1. How it works (Core Protocol)

```
User                         Consumer app              ZNS worker
────                         ─────────────              ──────────
                              creates session
                              renders ZIP-321 QR ──→    watches mempool
scans QR, sends payment ─→   waits for OTP  ←─────     decrypts payment,
                              verifies OTP locally       sends OTP response tx
```

The consumer app owns sessions and verifies the OTP. The worker watches the Zcash mempool, trial-decrypts incoming shielded payments, and sends a deterministic OTP code back in a transaction memo. Both sides derive the same HMAC key from the same wallet seed — no shared secret to rotate independently.

### `rust/` — the worker
A background process that owns one shielded Zcash wallet. Connects to a lightwalletd or Zaino gRPC endpoint, watches the mempool, and sends OTP responses. See [rust/README.md](rust/README.md) for full docs.

```bash
cd rust
cargo run -- init          # generate wallet, prints mnemonic + OTP key
cargo run                  # run the worker
```

---

## 2. Centralized Authentication Provider (`auth/`)

To allow hundreds of third-party apps to securely use Zcash login without building complex Zcash infrastructure themselves, we built a centralized **OpenID Connect (OIDC) Identity Provider**. 

The auth service bridges the gap between traditional Web2 applications and Web3 Zcash authentication.
- **Production URL**: `https://auth.zcash.me`
- Built on standard OAuth2 / OIDC protocols.
- Applications register their `redirect_uris` and receive a secure `clientId`.

```bash
cd auth
pnpm install
pnpm run dev # Runs locally on port 3000
```

---

## 3. The Developer SDK (`sdk/`)

The `@zcashme/login` SDK allows any vanilla JavaScript, React, or Vue application to instantly integrate ZcashMe authentication in 3 lines of code.

```typescript
import { ZcashMeAuth } from "@zcashme/login";

const authClient = new ZcashMeAuth({
  // domain: 'auth.zcash.me', // Automatically defaults to production!
  clientId: 'your-app-client-id',
  redirectUri: 'https://your-app.com/callback',
});

// Sends user to authenticate with Zcash
authClient.loginWithRedirect(); 
```

---

## 4. Production Integration Demo (`demo/`)

To prove the production readiness of the system, we integrated ZcashMe into the **PGPZ Community Platform** (`demo/`). Because PGPZ relies on `NextAuth.js` for session management, we fully integrated ZcashMe as a **Native NextAuth OAuth Provider** (`app/api/auth/[...nextauth]/route.ts`).

This proves ZcashMe can operate as a first-class citizen alongside GitHub, Google, or SIWE (Ethereum) login providers.

### How to run the demo locally:
1. Ensure the PGPZ app is registered in the database with a `redirect_uri` of `http://localhost:3000/api/auth/callback/zcashme`.
2. Start the demo application:
```bash
cd demo
pnpm install
pnpm run dev -p 3000
```
3. Navigate to `http://localhost:3000/identityTest` to test the native NextAuth ZcashMe integration!

---

## Quick Start

```bash
# Install all JS workspace dependencies
pnpm install

# Build the SDK
cd sdk && pnpm run build
```

Requires Rust 1.88+, Node 20+, pnpm 9+.