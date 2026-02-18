import { Injectable } from '@nestjs/common';
import { RoleLookup } from '../../application/ports/role-lookup';
import { RoleAbilitiesClaims } from '../../application/ports/token-service';
import { AuthConfig } from '../config/auth.config';

interface InternalRoleResponse {
  id: string;
  name: string;
  abilities: RoleAbilitiesClaims;
}

@Injectable()
export class HttpRoleLookup implements RoleLookup {
  constructor(private readonly config: AuthConfig) {}

  async getRoleAbilities(roleId: string): Promise<RoleAbilitiesClaims | null> {
    const url = `${this.config.roleServiceUrl}/${roleId}`;
    const response = await fetch(url, {
      headers: {
        'x-service-token': this.config.internalServiceToken,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Role lookup failed with status ${response.status}`);
    }

    const payload = (await response.json()) as InternalRoleResponse;
    return payload.abilities ?? null;
  }
}
