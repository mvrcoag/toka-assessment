import { RoleAbilitiesClaims } from './token-service';

export interface RoleLookup {
  getRoleAbilities(roleId: string): Promise<RoleAbilitiesClaims | null>;
}
