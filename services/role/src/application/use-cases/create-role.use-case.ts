import { Role } from '../../domain/entities/role';
import { RoleAbilities } from '../../domain/value-objects/role-abilities';
import { RoleName } from '../../domain/value-objects/role-name';
import { ApplicationError } from '../errors/application-error';
import { RoleRepository } from '../ports/role-repository';

export interface CreateRoleInput {
  name: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export class CreateRoleUseCase {
  constructor(private readonly repository: RoleRepository) {}

  async execute(input: CreateRoleInput): Promise<Role> {
    const name = RoleName.create(input.name);
    const existing = await this.repository.findByName(name);
    if (existing) {
      throw new ApplicationError('Role name already exists', 409);
    }

    const abilities = RoleAbilities.create({
      canView: input.canView,
      canCreate: input.canCreate,
      canUpdate: input.canUpdate,
      canDelete: input.canDelete,
    });

    const role = Role.create(name, abilities);
    await this.repository.save(role);
    return role;
  }
}
