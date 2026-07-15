"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { signInWithSiwe, linkWalletWithSiwe } from "@/lib/siwe/client";

type IdentitySuccess = {
  userId: string;
  user: unknown;
  claims: unknown;
};

type IdentityResponse = IdentitySuccess | { error: string };

export default function IdentityTestPage() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ready = status !== "loading";
  const authenticated = status === "authenticated";
  const [data, setData] = useState<IdentityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdentity = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(null);
      const res = await fetch("/api/identityTest", { cache: "no-store" });
      const json = (await res.json()) as IdentityResponse;
      if (!res.ok) {
        const msg = (json as { error?: string }).error || "Unauthorized";
        throw new Error(msg);
      }
      setData(json);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready && authenticated) {
      void fetchIdentity();
    }
  }, [ready, authenticated]);

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Identity Test</h1>
      <p>
        Status: {ready ? (authenticated ? "Authenticated" : "Unauthenticated") : "Initializing..."}
      </p>

      {!authenticated ? (
        <div className="space-x-2">
          <Button
            onClick={async () => {
              const res = await signInWithSiwe();
              if (!res.ok) {
                const current = (() => {
                  const q = searchParams?.toString();
                  return q && q.length ? `${pathname}?${q}` : pathname || "/";
                })();
                router.push(`/signin?callbackUrl=${encodeURIComponent(current)}&reason=wallet-unlinked`);
                return;
              }
            }}
          >
            Login with Wallet
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              import("next-auth/react").then(({ signIn }) => {
                signIn("zcashme");
              });
            }}
          >
            Login with ZcashMe
          </Button>
        </div>
      ) : (
        <div className="space-x-2">
          <Button onClick={fetchIdentity} disabled={loading}>
            {loading ? "Verifying…" : "Verify Identity"}
          </Button>
          <Button
            onClick={async () => {
              const res = await linkWalletWithSiwe();
              if (!res.ok) {
                alert(res.error || "Linking failed");
              } else {
                alert("Wallet linked successfully");
              }
            }}
          >
            Link Wallet
          </Button>
          <Button variant="outline" onClick={() => signOut()}>
            Log Out
          </Button>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {data && data.claims && (
        <section className="mt-8 rounded-lg border p-6 shadow-sm space-y-6 bg-card text-card-foreground">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Finish setting up your profile</h2>
            <p className="text-sm text-muted-foreground">
              We securely imported your ZcashMe identity. Please verify your details to join PGPZ.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-md border border-border">
            <div className="w-16 h-16 rounded-full bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
              {(data.claims as any).picture ? (
                <img src={(data.claims as any).picture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </div>
            <div className="w-full space-y-1.5">
              <label className="text-sm font-medium">
                ZcashMe Link
              </label>
              <input
                disabled
                value={`zcash.me/${(data.claims as any).name !== (data.claims as any).sub ? (data.claims as any).name : "username"}`}
                className="w-full rounded-md border px-3 py-2 text-sm bg-muted/50 text-muted-foreground font-mono cursor-not-allowed dark:border-input"
              />
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); alert("Profile successfully created!"); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First name</label>
                <input
                  defaultValue={(data.claims as any).name !== (data.claims as any).sub ? (data.claims as any).name : ""}
                  required
                  className="w-full rounded-md border px-3 py-2 text-sm dark:bg-input/30 dark:border-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last name</label>
                <input
                  required
                  className="w-full rounded-md border px-3 py-2 text-sm dark:bg-input/30 dark:border-input"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Zcash Address</label>
              <input
                disabled
                defaultValue={(data.claims as any).sub}
                className="w-full rounded-md border px-3 py-2 text-sm bg-muted/50 text-muted-foreground font-mono cursor-not-allowed dark:border-input"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                required
                className="w-full rounded-md border px-3 py-2 text-sm dark:bg-input/30 dark:border-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">X handle (optional)</label>
                <input
                  placeholder="@handle"
                  className="w-full rounded-md border px-3 py-2 text-sm dark:bg-input/30 dark:border-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">LinkedIn URL (optional)</label>
                <input
                  placeholder="https://www.linkedin.com/in/username"
                  className="w-full rounded-md border px-3 py-2 text-sm dark:bg-input/30 dark:border-input"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit">
                Save & Complete Profile
              </Button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
