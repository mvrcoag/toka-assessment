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
    delete process.env.RABBITMQ_URL;
    delete process.env.RABBITMQ_EXCHANGE;
    delete process.env.RABBITMQ_QUEUE;
    const config = new AuditConfig();
    expect(config.mongoUrl).toContain('mongodb');
    expect(config.rabbitmqUrl).toContain('amqp://');
    expect(config.rabbitmqExchange).toBe('toka.events');
    expect(config.rabbitmqQueue).toBe('audit.logs');
  });

  it('reads configured env values', () => {
    process.env.MONGODB_URI = 'mongodb://custom';
    process.env.AUTH_ISSUER = 'http://issuer';
    process.env.AUTH_JWKS_URI = 'http://jwks';
    process.env.RABBITMQ_URL = 'amqp://custom';
    process.env.RABBITMQ_EXCHANGE = 'custom.events';
    process.env.RABBITMQ_QUEUE = 'custom.queue';
    const config = new AuditConfig();
    expect(config.mongoUrl).toBe('mongodb://custom');
    expect(config.authIssuer).toBe('http://issuer');
    expect(config.authJwksUri).toBe('http://jwks');
    expect(config.rabbitmqUrl).toBe('amqp://custom');
    expect(config.rabbitmqExchange).toBe('custom.events');
    expect(config.rabbitmqQueue).toBe('custom.queue');
  });
});
