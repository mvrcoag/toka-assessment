import { AuthConfig } from './auth.config';

describe('AuthConfig', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterAll(() => {
    process.env = env;
  });

  it('uses defaults when env is missing', () => {
    delete process.env.ISSUER;
    const config = new AuthConfig();
    expect(config.issuer).toContain('localhost');
    expect(config.redisUrl).toContain('redis');
    expect(config.postgresUrl).toContain('postgresql://');
  });

  it('reads configured env values', () => {
    process.env.ISSUER = 'http://issuer';
    process.env.AUTH_SCOPES = 'openid email';
    process.env.JWT_KID = 'kid-1';
    process.env.REDIS_URL = 'redis://custom';
    process.env.DATABASE_URL = 'postgresql://custom';

    const config = new AuthConfig();
    expect(config.issuer).toBe('http://issuer');
    expect(config.supportedScopes).toEqual(['openid', 'email']);
    expect(config.jwtKeyId).toBe('kid-1');
    expect(config.redisUrl).toBe('redis://custom');
    expect(config.postgresUrl).toBe('postgresql://custom');
  });
});
