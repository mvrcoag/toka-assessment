import { Injectable } from '@nestjs/common';

@Injectable()
export class UserConfig {
  readonly postgresUrl: string;
  readonly authIssuer: string;
  readonly authJwksUri: string;
  readonly rabbitmqUrl: string;
  readonly rabbitmqExchange: string;

  constructor() {
    this.postgresUrl =
      process.env.DATABASE_URL ??
      'postgresql://toka:toka_password@postgres:5432/toka';
    this.authIssuer = process.env.AUTH_ISSUER ?? 'http://localhost:8000/auth';
    this.authJwksUri =
      process.env.AUTH_JWKS_URI ??
      'http://kong:8000/auth/.well-known/jwks.json';
    this.rabbitmqUrl =
      process.env.RABBITMQ_URL ?? 'amqp://toka:toka_password@rabbitmq:5672';
    this.rabbitmqExchange = process.env.RABBITMQ_EXCHANGE ?? 'toka.events';
  }
}
