import { Role } from '../../domain/entities/role';
import { RoleId } from '../../domain/value-objects/role-id';
import { RoleName } from '../../domain/value-objects/role-name';

export interface RoleRepository {
  findById(id: RoleId): Promise<Role | null>;
  findByName(name: RoleName): Promise<Role | null>;
  list(): Promise<Role[]>;
  save(role: Role): Promise<void>;
  delete(role: Role): Promise<void>;
}
