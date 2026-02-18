import {
  OAuthClient,
  OAuthClientRepository,
} from '../../application/ports/oauth-client-repository';
import { AuthConfig } from '../config/auth.config';

export class StaticOAuthClientRepository implements OAuthClientRepository {
  private readonly client: OAuthClient;

  constructor(config: AuthConfig) {
    this.client = {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUris: config.redirectUris,
      allowedScopes: config.allowedScopes,
    };
  }

  async findById(clientId: string): Promise<OAuthClient | null> {
    if (clientId !== this.client.clientId) {
      return null;
    }

    return this.client;
  }
}
