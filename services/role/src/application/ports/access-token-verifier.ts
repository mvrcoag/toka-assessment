export interface AccessTokenClaims {
  sub: string;
  role?: string;
  scope?: string;
}

export interface AccessTokenVerifier {
  verify(token: string): Promise<AccessTokenClaims>;
}
