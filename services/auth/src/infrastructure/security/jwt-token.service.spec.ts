import { JwtTokenService } from './jwt-token.service';
import { AuthSettings } from '../../application/ports/auth-settings';
import { Clock } from '../../application/ports/clock';
import { AuthConfig } from '../config/auth.config';

describe('JwtTokenService', () => {
  it('issues and verifies access tokens', async () => {
    const settings: AuthSettings = {
      issuer: 'http://issuer',
      authorizationEndpoint: '',
      tokenEndpoint: '',
      userinfoEndpoint: '',
      jwksUri: '',
      supportedScopes: ['openid'],
      responseTypes: ['code'],
      subjectTypes: ['public'],
      idTokenSigningAlgorithms: ['RS256'],
      tokenEndpointAuthMethods: ['client_secret_post'],
      accessTokenTtlSeconds: 60,
      refreshTokenTtlSeconds: 60,
      authCodeTtlSeconds: 60,
    };
    const clock: Clock = { now: () => new Date() };
    const config = { jwtKeyId: 'kid-1' } as AuthConfig;

    const service = new JwtTokenService(settings, clock, config);
    const issued = await service.issueAccessToken({
      sub: 'user-1',
      email: 'user@toka.local',
      name: 'Toka User',
      role: 'user',
      scope: 'openid',
      clientId: 'client-1',
    });

    const verified = await service.verifyAccessToken(issued.token);
    expect(verified.payload.sub).toBe('user-1');
    expect(verified.jti).toBe(issued.jti);
  });

  it('issues id and refresh tokens', async () => {
    const settings: AuthSettings = {
      issuer: 'http://issuer',
      authorizationEndpoint: '',
      tokenEndpoint: '',
      userinfoEndpoint: '',
      jwksUri: '',
      supportedScopes: ['openid'],
      responseTypes: ['code'],
      subjectTypes: ['public'],
      idTokenSigningAlgorithms: ['RS256'],
      tokenEndpointAuthMethods: ['client_secret_post'],
      accessTokenTtlSeconds: 3600,
      refreshTokenTtlSeconds: 3600,
      authCodeTtlSeconds: 3600,
    };
    const clock: Clock = { now: () => new Date() };
    const config = { jwtKeyId: 'kid-1' } as AuthConfig;
    const service = new JwtTokenService(settings, clock, config);

    const idToken = await service.issueIdToken({
      sub: 'user-1',
      email: 'user@toka.local',
      name: 'Toka User',
      role: 'user',
      aud: 'client-1',
    });
    const refreshToken = await service.issueRefreshToken({
      sub: 'user-1',
      clientId: 'client-1',
      scope: 'openid',
    });

    const verifiedRefresh = await service.verifyRefreshToken(refreshToken.token);
    expect(idToken.token.length).toBeGreaterThan(10);
    expect(verifiedRefresh.payload.sub).toBe('user-1');
    expect(service.getIssuer()).toBe('http://issuer');
  });

  it('returns jwks', async () => {
    const settings: AuthSettings = {
      issuer: 'http://issuer',
      authorizationEndpoint: '',
      tokenEndpoint: '',
      userinfoEndpoint: '',
      jwksUri: '',
      supportedScopes: ['openid'],
      responseTypes: ['code'],
      subjectTypes: ['public'],
      idTokenSigningAlgorithms: ['RS256'],
      tokenEndpointAuthMethods: ['client_secret_post'],
      accessTokenTtlSeconds: 3600,
      refreshTokenTtlSeconds: 3600,
      authCodeTtlSeconds: 3600,
    };
    const clock: Clock = { now: () => new Date() };
    const config = { jwtKeyId: 'kid-1' } as AuthConfig;
    const service = new JwtTokenService(settings, clock, config);
    const jwks = await service.getJwks();
    expect(Array.isArray((jwks as { keys?: unknown[] }).keys)).toBe(true);
  });
});
