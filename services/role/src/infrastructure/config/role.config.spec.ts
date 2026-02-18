import { RoleConfig } from './role.config';

describe('RoleConfig', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterAll(() => {
    process.env = env;
  });

  it('uses defaults when env is missing', () => {
    delete process.env.DATABASE_URL;
    delete process.env.AUTH_ISSUER;
    delete process.env.AUTH_JWKS_URI;
    const config = new RoleConfig();
    expect(config.postgresUrl).toContain('postgresql://');
    expect(config.authIssuer).toContain('localhost');
    expect(config.authJwksUri).toContain('jwks');
  });

  it('reads env values', () => {
    process.env.DATABASE_URL = 'postgresql://custom';
    process.env.AUTH_ISSUER = 'http://issuer';
    process.env.AUTH_JWKS_URI = 'http://jwks';
    const config = new RoleConfig();
    expect(config.postgresUrl).toBe('postgresql://custom');
    expect(config.authIssuer).toBe('http://issuer');
    expect(config.authJwksUri).toBe('http://jwks');
  });
});
