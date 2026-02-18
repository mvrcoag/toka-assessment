import { AuditConfig } from './audit.config';

describe('AuditConfig', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterAll(() => {
    process.env = env;
  });

  it('loads defaults', () => {
    delete process.env.MONGODB_URI;
    const config = new AuditConfig();
    expect(config.mongoUrl).toContain('mongodb');
  });

  it('reads configured env values', () => {
    process.env.MONGODB_URI = 'mongodb://custom';
    process.env.AUTH_ISSUER = 'http://issuer';
    process.env.AUTH_JWKS_URI = 'http://jwks';
    const config = new AuditConfig();
    expect(config.mongoUrl).toBe('mongodb://custom');
    expect(config.authIssuer).toBe('http://issuer');
    expect(config.authJwksUri).toBe('http://jwks');
  });
});
