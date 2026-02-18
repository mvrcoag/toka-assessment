import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditConfig {
  readonly mongoUrl: string;
  readonly authIssuer: string;
  readonly authJwksUri: string;
  readonly rabbitmqUrl: string;
  readonly rabbitmqExchange: string;
  readonly rabbitmqQueue: string;

  constructor() {
    this.mongoUrl =
      process.env.MONGODB_URI ??
      'mongodb://toka:toka_password@mongodb:27017/audit?authSource=admin';
    this.authIssuer = process.env.AUTH_ISSUER ?? 'http://localhost:8000/auth';
    this.authJwksUri =
      process.env.AUTH_JWKS_URI ??
      'http://kong:8000/auth/.well-known/jwks.json';
    this.rabbitmqUrl =
      process.env.RABBITMQ_URL ?? 'amqp://toka:toka_password@rabbitmq:5672';
    this.rabbitmqExchange = process.env.RABBITMQ_EXCHANGE ?? 'toka.events';
    this.rabbitmqQueue = process.env.RABBITMQ_QUEUE ?? 'audit.logs';
  }
}
