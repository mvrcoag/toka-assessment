export interface AccessTokenClaims {
  sub: string;
  role?: string;
  roleAbilities?: {
    canView?: boolean;
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
  };
  scope?: string;
}

export interface AccessTokenVerifier {
  verify(token: string): Promise<AccessTokenClaims>;
}
