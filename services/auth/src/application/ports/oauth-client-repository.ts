export interface OAuthClient {
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  allowedScopes: string[];
}

export interface OAuthClientRepository {
  findById(clientId: string): Promise<OAuthClient | null>;
}
