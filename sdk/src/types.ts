export interface ZcashMeOptions {
  domain?: string;
  clientId: string;
  redirectUri: string;
  scopes?: string[];
}

export interface TokenResponse {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
}
