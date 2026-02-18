import { OidcTokenVerifier } from './oidc-token-verifier';
import { AuditConfig } from '../config/audit.config';

const jwtVerify = jest.fn(async () => ({
  payload: { sub: 'user-1', role: 'admin', scope: 'openid' },
}));
const createRemoteJWKSet = jest.fn(() => 'jwks');

jest.mock('jose', () => ({
  jwtVerify: (...args: any[]) => jwtVerify(...args),
  createRemoteJWKSet: (...args: any[]) => createRemoteJWKSet(...args),
}));

describe('OidcTokenVerifier', () => {
  it('verifies token using JWKS', async () => {
    const config = {
      authIssuer: 'http://issuer',
      authJwksUri: 'http://jwks',
    } as AuditConfig;
    const verifier = new OidcTokenVerifier(config);

    const claims = await verifier.verify('token');
    expect(createRemoteJWKSet).toHaveBeenCalled();
    expect(jwtVerify).toHaveBeenCalledWith('token', 'jwks', {
      issuer: 'http://issuer',
    });
    expect(claims.sub).toBe('user-1');
  });
});
