# zns-login

Zcash-based authentication: pay to log in. A shielded Zcash payment proves
identity — no password, no email, no third party.

## How it works

```
User                         Consumer app              ZNS worker
────                         ─────────────              ──────────
                              creates session
                              renders ZIP-321 QR ──→    watches mempool
scans QR, sends payment ─→   waits for OTP  ←─────     decrypts payment,
                              verifies OTP locally       sends OTP response tx
```

The consumer app owns sessions and verifies the OTP. The worker watches the
Zcash mempool, trial-decrypts incoming shielded payments, and sends a
deterministic OTP code back in a transaction memo. Both sides derive the same
HMAC key from the same wallet seed — no shared secret to rotate independently.

## Monorepo layout

```
zns-login/
├── rust/                 # Rust worker (the authentication backend)
├── packages/zns-login/  # TypeScript SDK for consumer apps
└── pnpm-workspace.yaml
```

### `rust/` — the worker

A background process that owns one shielded Zcash wallet. Connects to a
lightwalletd or Zaino gRPC endpoint, watches the mempool, and sends OTP
responses. See [rust/README.md](rust/README.md) for full docs.

```bash
cd rust
cargo run -- init          # generate wallet, prints mnemonic + OTP key
cargo run                   # run the worker
```

### `packages/zns-login/` — consumer SDK

```bash
pnpm install
pnpm --filter @zns/login build
```

```typescript
import { ZnsClient } from "@zns/login";

const zns = new ZnsClient("https://your-worker.example.com");
const session = await zns.createSession({ mode: "otp" });
// render session.zip321_uri as a QR code
// poll session.session_id until status === "authenticated"
```

## Quick start

```bash
# JS workspace
pnpm install

# Rust worker
cd rust && cargo run -- init
```

Requires Rust 1.88+, Node 20+, pnpm 9+.