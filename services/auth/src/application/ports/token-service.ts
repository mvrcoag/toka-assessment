export interface IssuedToken {
  token: string;
  jti: string;
  expiresAt: Date;
}

export interface VerifiedToken<TPayload extends Record<string, unknown>> {
  payload: TPayload;
  jti: string;
  expiresAt: Date;
}

export interface AccessTokenPayload extends Record<string, unknown> {
  sub: string;
  email: string;
  name: string;
  role: string;
  scope: string;
  clientId: string;
}

export interface IdTokenPayload extends Record<string, unknown> {
  sub: string;
  email: string;
  name: string;
  role: string;
  aud: string;
}

export interface RefreshTokenPayload extends Record<string, unknown> {
  sub: string;
  clientId: string;
  scope: string;
}

export interface TokenService {
  issueAccessToken(payload: AccessTokenPayload): Promise<IssuedToken>;
  issueIdToken(payload: IdTokenPayload): Promise<IssuedToken>;
  issueRefreshToken(payload: RefreshTokenPayload): Promise<IssuedToken>;
  verifyAccessToken(token: string): Promise<VerifiedToken<AccessTokenPayload>>;
  verifyRefreshToken(token: string): Promise<VerifiedToken<RefreshTokenPayload>>;
  getJwks(): Promise<Record<string, unknown>>;
  getIssuer(): string;
}
