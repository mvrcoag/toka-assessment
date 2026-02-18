import { StaticOAuthClientRepository } from './static-client.repository';
import { AuthConfig } from '../config/auth.config';

describe('StaticOAuthClientRepository', () => {
  it('returns configured client', async () => {
    const config = {
      clientId: 'client-1',
      clientSecret: 'secret',
      redirectUris: ['http://localhost/callback'],
      allowedScopes: ['openid'],
    } as AuthConfig;
    const repo = new StaticOAuthClientRepository(config);
    const client = await repo.findById('client-1');
    expect(client?.clientId).toBe('client-1');
  });

  it('returns null for unknown client', async () => {
    const config = {
      clientId: 'client-1',
      clientSecret: 'secret',
      redirectUris: [],
      allowedScopes: [],
    } as AuthConfig;
    const repo = new StaticOAuthClientRepository(config);
    await expect(repo.findById('other')).resolves.toBeNull();
  });
});
