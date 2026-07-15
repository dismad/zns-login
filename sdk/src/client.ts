import { ZcashMeOptions, TokenResponse } from './types';

export class ZcashMeAuth {
  private domain: string;
  private clientId: string;
  private redirectUri: string;
  private scopes: string[];

  constructor(options: ZcashMeOptions) {
    const rawDomain = options.domain || 'auth.zcash.me';
    this.domain = rawDomain.replace(/\/$/, ''); // remove trailing slash if provided
    this.clientId = options.clientId;
    this.redirectUri = options.redirectUri;
    this.scopes = options.scopes || ['openid', 'profile', 'email'];
  }

  private getBaseUrl(): string {
    return this.domain.startsWith('http') ? this.domain : `https://${this.domain}`;
  }

  /**
   * Generates the authorization URL to redirect the user to.
   */
  public getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
    });
    
    if (state) {
      params.append('state', state);
    }

    return `${this.getBaseUrl()}/authorize?${params.toString()}`;
  }

  /**
   * Redirects the current browser window to the authorization URL.
   * Only works in browser environments.
   */
  public loginWithRedirect(state?: string): void {
    if (typeof window !== 'undefined') {
      window.location.href = this.getAuthorizationUrl(state);
    } else {
      throw new Error('loginWithRedirect can only be used in a browser environment');
    }
  }

  /**
   * Exchanges the authorization code for an access token.
   */
  public async handleCallback(code: string): Promise<TokenResponse> {
    const response = await fetch(`${this.getBaseUrl()}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange code for token: ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Fetches user info using the access token.
   */
  public async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch(`${this.getBaseUrl()}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return await response.json();
  }
}
