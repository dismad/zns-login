export type AuthMode = "seamless" | "otp";

export interface CreateSessionRequest {
  mode: AuthMode;
}

export interface CreateSessionResponse {
  session_id: string;
  zfa_address: string;
  zip321_uri: string;
  memo_payload: string;
  expires_at: string;
}

export type SessionStatus = "pending" | "authenticated" | "expired" | "failed";

export interface SessionStatusResponse {
  status: SessionStatus;
  address?: string;
  authenticated_at?: string;
}
