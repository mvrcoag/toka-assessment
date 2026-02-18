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
    delete process.env.RABBITMQ_URL;
    delete process.env.RABBITMQ_EXCHANGE;
    const config = new UserConfig();
    expect(config.postgresUrl).toContain('postgresql://');
    expect(config.authIssuer).toContain('http://');
    expect(config.rabbitmqUrl).toContain('amqp://');
    expect(config.rabbitmqExchange).toBe('toka.events');
  });

  it('reads env values', () => {
    process.env.DATABASE_URL = 'postgresql://custom';
    process.env.AUTH_ISSUER = 'http://issuer';
    process.env.AUTH_JWKS_URI = 'http://jwks';
    process.env.RABBITMQ_URL = 'amqp://custom';
    process.env.RABBITMQ_EXCHANGE = 'custom.events';
    const config = new UserConfig();
    expect(config.postgresUrl).toBe('postgresql://custom');
    expect(config.authIssuer).toBe('http://issuer');
    expect(config.authJwksUri).toBe('http://jwks');
    expect(config.rabbitmqUrl).toBe('amqp://custom');
    expect(config.rabbitmqExchange).toBe('custom.events');
  });
});
