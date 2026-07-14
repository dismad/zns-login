import type { CreateSessionRequest, CreateSessionResponse, SessionStatusResponse } from "./types.js";

export class ZnsClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async createSession(req: CreateSessionRequest): Promise<CreateSessionResponse> {
    const res = await fetch(`${this.baseUrl}/session/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    });
    if (!res.ok) {
      throw new Error(`Failed to create session: ${res.statusText}`);
    }
    return res.json();
  }

  async pollSession(sessionId: string): Promise<SessionStatusResponse> {
    const res = await fetch(`${this.baseUrl}/session/${sessionId}/status`);
    if (!res.ok) {
      throw new Error(`Failed to poll session: ${res.statusText}`);
    }
    return res.json();
  }
}
