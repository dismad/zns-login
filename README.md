# ZcashMe Auth (`zns-login`)

**Sign in with Zcash.** A shielded payment proves your identity — no passwords, no emails, no third-party tracking.

This monorepo contains the infrastructure that makes "Sign in with Zcash" possible for both users and web developers. 

---

## Why we built this

Authenticating with Web3 on a desktop browser usually requires clunky browser extensions that dox your entire financial history. ZcashMe solves this by turning the Zcash blockchain into a private, decentralized SMS-alternative for Two-Factor Authentication.

We solved four massive problems to make this work:

1. **The Human Readability Problem (ZNS)**
   Zcash shielded addresses are huge and impossible to memorize. With ZcashMe, you just type your Zcash Name System (ZNS) username. We resolve it to your underlying address behind the scenes.
2. **The Desktop-to-Mobile Airgap (OTPs)**
   You scan a QR code on your laptop with your mobile Zcash wallet and send a tiny payment. Our on-chain node intercepts the payment, derives a One-Time Passcode (OTP), and sends it back to your phone via an encrypted memo. You type the OTP into the website. It feels exactly like SMS 2FA, but fully private.
3. **The Sybil-Resistant Filter (Pay-to-login)**
   Because requesting an OTP requires a real Zcash micro-transaction (0.002 ZEC + network fee), botnets are economically priced out. You can't spam fake accounts if every account costs real money to create.
4. **Developer Friction (OIDC)**
   Web developers don't want to run Zcash nodes or parse mempools. We built an Identity Broker that translates this complex blockchain flow into standard OAuth2. Any developer can add "Sign in with Zcash" in 3 lines of code.

---

## Architecture: How it actually works

To make Zcash login compatible with the existing web, the system is split into two halves: an **Identity Broker** and an **Authenticator Node**.

```text
Client App               Identity Broker (auth.zcash.me)         Authenticator Node (Rust)
──────────               ───────────────────────────────         ─────────────────────────
1. "Login with Zcash" ──→ 2. Resolves ZNS, shows QR
                          3. Waits for on-chain OTP     
                             (Shares HMAC seed) ───────────────── (Shares HMAC seed)
                                                                  4. Watches mempool
5. User scans & pays  ──────────────────────────────────────────→ 6. Trial-decrypts tx
                                                                  7. Derives OTP
                          9. Verifies OTP locally       ←──────── 8. Sends response tx with OTP
10. Issues JWT ←─────────
```

### 1. The Authenticator Node (`rust/`)
**Run by: The ZcashMe Core Team**
A headless, on-chain one-time-password relayer built on `librustzcash`. It watches the Zcash mempool for incoming login payments. When it sees one, it derives a deterministic OTP and broadcasts a return transaction with the code hidden in the memo. It has no open ports and no concept of web sessions.

### 2. The Identity Broker (`auth/`)
**Run by: The ZcashMe Core Team** (`https://auth.zcash.me`)
A fully certified OpenID Connect (OIDC) provider allowing standard Web2 OAuth requests into Web3 Zcash payment sessions. 

---

## For Developers

### Using the SDK (`sdk/`)
Because we host the Identity Broker, you don't need to touch the blockchain. You can integrate ZcashMe into any JS app using our lightweight SDK:

```typescript
import { ZcashMeAuth } from "@zcashme/login";

const authClient = new ZcashMeAuth({
  clientId: 'your-app-client-id',
  redirectUri: 'https://your-app.com/callback',
});

// Redirects the user to the Zcash auth flow
authClient.loginWithRedirect(); 
```

### A Simple Demo (`demo/`)
To prove this works in the wild, we forked the PGPZ Community Platform and integrated ZcashMe as a native NextAuth provider. 

To run the demo locally:
```bash
cd demo
pnpm install
pnpm run dev -p 3000
```
Navigate to `http://localhost:3000/identityTest` to see the flow in action.

---

## Local Development Quick Start

If you want to run the entire stack yourself (Node + Broker):

```bash
# 1. Install workspace dependencies
pnpm install
cd sdk && pnpm run build

# 2. Run the Rust Authenticator Node
cd rust
cargo run -- init # Generates wallet & OTP seed
cargo run

# 3. Run the Identity Broker
cd ../auth
pnpm run dev
```

*(Requires Rust 1.88+, Node 20+, pnpm 9+)*
