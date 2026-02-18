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
    delete process.env.RABBITMQ_URL;
    delete process.env.RABBITMQ_EXCHANGE;
    const config = new AuthConfig();
    expect(config.issuer).toContain('localhost');
    expect(config.redisUrl).toContain('redis');
    expect(config.postgresUrl).toContain('postgresql://');
    expect(config.rabbitmqUrl).toContain('amqp://');
    expect(config.rabbitmqExchange).toBe('toka.events');
  });

  it('reads configured env values', () => {
    process.env.ISSUER = 'http://issuer';
    process.env.AUTH_SCOPES = 'openid email';
    process.env.JWT_KID = 'kid-1';
    process.env.REDIS_URL = 'redis://custom';
    process.env.DATABASE_URL = 'postgresql://custom';
    process.env.RABBITMQ_URL = 'amqp://custom';
    process.env.RABBITMQ_EXCHANGE = 'custom.events';

    const config = new AuthConfig();
    expect(config.issuer).toBe('http://issuer');
    expect(config.supportedScopes).toEqual(['openid', 'email']);
    expect(config.jwtKeyId).toBe('kid-1');
    expect(config.redisUrl).toBe('redis://custom');
    expect(config.postgresUrl).toBe('postgresql://custom');
    expect(config.rabbitmqUrl).toBe('amqp://custom');
    expect(config.rabbitmqExchange).toBe('custom.events');
  });
});
