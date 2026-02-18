import { Injectable } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AccessTokenClaims, AccessTokenVerifier } from '../../application/ports/access-token-verifier';
import { AuditConfig } from '../config/audit.config';

@Injectable()
export class OidcTokenVerifier implements AccessTokenVerifier {
  private readonly jwks;

  constructor(private readonly config: AuditConfig) {
    this.jwks = createRemoteJWKSet(new URL(this.config.authJwksUri));
  }

  async verify(token: string): Promise<AccessTokenClaims> {
    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: this.config.authIssuer,
    });

    const roleAbilities = this.parseRoleAbilities(payload.roleAbilities);

    return {
      sub: String(payload.sub ?? ''),
      role: typeof payload.role === 'string' ? payload.role : undefined,
      roleAbilities,
      scope: typeof payload.scope === 'string' ? payload.scope : undefined,
    };
  }

  private parseRoleAbilities(value: unknown): AccessTokenClaims['roleAbilities'] {
    if (!value || typeof value !== 'object') {
      return undefined;
    }
    const abilities = value as Record<string, unknown>;
    const parsed = {
      canView: typeof abilities.canView === 'boolean' ? abilities.canView : undefined,
      canCreate: typeof abilities.canCreate === 'boolean' ? abilities.canCreate : undefined,
      canUpdate: typeof abilities.canUpdate === 'boolean' ? abilities.canUpdate : undefined,
      canDelete: typeof abilities.canDelete === 'boolean' ? abilities.canDelete : undefined,
    };

    return Object.values(parsed).some((entry) => typeof entry === 'boolean')
      ? parsed
      : undefined;
  }
}
