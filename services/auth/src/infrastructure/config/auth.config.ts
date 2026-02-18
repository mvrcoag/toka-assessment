import { Injectable } from '@nestjs/common';
import { AuthSettings } from '../../application/ports/auth-settings';

@Injectable()
export class AuthConfig implements AuthSettings {
  readonly issuer: string;
  readonly authorizationEndpoint: string;
  readonly tokenEndpoint: string;
  readonly userinfoEndpoint: string;
  readonly jwksUri: string;
  readonly supportedScopes: string[];
  readonly responseTypes: string[] = ['code'];
  readonly subjectTypes: string[] = ['public'];
  readonly idTokenSigningAlgorithms: string[] = ['RS256'];
  readonly tokenEndpointAuthMethods: string[] = ['client_secret_post'];
  readonly accessTokenTtlSeconds: number;
  readonly refreshTokenTtlSeconds: number;
  readonly authCodeTtlSeconds: number;

  readonly redisUrl: string;
  readonly postgresUrl: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUris: string[];
  readonly allowedScopes: string[];


  readonly jwtKeyId: string;
  readonly jwtPrivateKey?: string;
  readonly jwtPublicKey?: string;

  constructor() {
    this.issuer = process.env.ISSUER ?? 'http://localhost:8000/auth';
    this.authorizationEndpoint = `${this.issuer}/oauth/authorize`;
    this.tokenEndpoint = `${this.issuer}/oauth/token`;
    this.userinfoEndpoint = `${this.issuer}/oauth/userinfo`;
    this.jwksUri = `${this.issuer}/.well-known/jwks.json`;

    this.supportedScopes = (process.env.AUTH_SCOPES ?? 'openid profile email')
      .split(' ')
      .map((value) => value.trim())
      .filter(Boolean);

    this.accessTokenTtlSeconds = Number(
      process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900,
    );
    this.refreshTokenTtlSeconds = Number(
      process.env.REFRESH_TOKEN_TTL_SECONDS ?? 86400,
    );
    this.authCodeTtlSeconds = Number(process.env.AUTH_CODE_TTL_SECONDS ?? 600);

    this.redisUrl = process.env.REDIS_URL ?? 'redis://redis:6379';
    this.postgresUrl =
      process.env.DATABASE_URL ??
      'postgresql://toka:toka_password@postgres:5432/toka';
    this.clientId = process.env.OAUTH_CLIENT_ID ?? 'toka-client';
    this.clientSecret = process.env.OAUTH_CLIENT_SECRET ?? 'toka-secret';
    this.redirectUris = (process.env.OAUTH_REDIRECT_URIS ?? 'http://localhost:3000/callback')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    this.allowedScopes = this.supportedScopes;

    this.jwtKeyId = process.env.JWT_KID ?? 'toka-key-1';
    this.jwtPrivateKey = process.env.JWT_PRIVATE_KEY;
    this.jwtPublicKey = process.env.JWT_PUBLIC_KEY;
  }
}
