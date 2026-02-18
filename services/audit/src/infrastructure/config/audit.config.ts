import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditConfig {
  readonly mongoUrl: string;
  readonly authIssuer: string;
  readonly authJwksUri: string;

  constructor() {
    this.mongoUrl =
      process.env.MONGODB_URI ??
      'mongodb://toka:toka_password@mongodb:27017/audit?authSource=admin';
    this.authIssuer = process.env.AUTH_ISSUER ?? 'http://localhost:8000/auth';
    this.authJwksUri =
      process.env.AUTH_JWKS_URI ??
      'http://kong:8000/auth/.well-known/jwks.json';
  }
}
