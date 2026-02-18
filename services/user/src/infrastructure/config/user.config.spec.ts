import { UserConfig } from './user.config';

describe('UserConfig', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterAll(() => {
    process.env = env;
  });

  it('uses defaults', () => {
    delete process.env.DATABASE_URL;
    const config = new UserConfig();
    expect(config.postgresUrl).toContain('postgresql://');
    expect(config.authIssuer).toContain('http://');
  });

  it('reads env values', () => {
    process.env.DATABASE_URL = 'postgresql://custom';
    process.env.AUTH_ISSUER = 'http://issuer';
    process.env.AUTH_JWKS_URI = 'http://jwks';
    const config = new UserConfig();
    expect(config.postgresUrl).toBe('postgresql://custom');
    expect(config.authIssuer).toBe('http://issuer');
    expect(config.authJwksUri).toBe('http://jwks');
  });
});
