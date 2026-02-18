import { OidcTokenVerifier } from './oidc-token-verifier';
import { RoleConfig } from '../config/role.config';

const jwtVerify = jest.fn();
const createRemoteJWKSet = jest.fn(() => ({}));

jest.mock('jose', () => ({
  jwtVerify: (...args: unknown[]) => jwtVerify(...args),
  createRemoteJWKSet: (...args: unknown[]) => createRemoteJWKSet(...args),
}));

describe('OidcTokenVerifier', () => {
  it('verifies token and maps claims', async () => {
    jwtVerify.mockResolvedValue({
      payload: {
        sub: 'user-1',
        role: 'admin',
        scope: 'openid',
      },
    });
    const config = {
      authIssuer: 'http://issuer',
      authJwksUri: 'http://jwks',
    } as RoleConfig;
    const verifier = new OidcTokenVerifier(config);

    const claims = await verifier.verify('token');
    expect(claims.sub).toBe('user-1');
    expect(claims.role).toBe('admin');
    expect(claims.scope).toBe('openid');
  });
});
