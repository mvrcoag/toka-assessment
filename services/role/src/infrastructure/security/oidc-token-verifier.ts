import { Injectable } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AccessTokenClaims, AccessTokenVerifier } from '../../application/ports/access-token-verifier';
import { RoleConfig } from '../config/role.config';

@Injectable()
export class OidcTokenVerifier implements AccessTokenVerifier {
  private readonly jwks;

  constructor(private readonly config: RoleConfig) {
    this.jwks = createRemoteJWKSet(new URL(this.config.authJwksUri));
  }

  async verify(token: string): Promise<AccessTokenClaims> {
    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: this.config.authIssuer,
    });

    return {
      sub: String(payload.sub ?? ''),
      role: typeof payload.role === 'string' ? payload.role : undefined,
      scope: typeof payload.scope === 'string' ? payload.scope : undefined,
    };
  }
}
