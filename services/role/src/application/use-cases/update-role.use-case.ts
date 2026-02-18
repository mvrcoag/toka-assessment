import { RoleAbilities } from '../../domain/value-objects/role-abilities';
import { RoleId } from '../../domain/value-objects/role-id';
import { RoleName } from '../../domain/value-objects/role-name';
import { ApplicationError } from '../errors/application-error';
import { EventBus } from '../ports/event-bus';
import { RoleRepository } from '../ports/role-repository';

export interface UpdateRoleInput {
  id: string;
  name?: string;
  canView?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export class UpdateRoleUseCase {
  constructor(
    private readonly repository: RoleRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: UpdateRoleInput) {
    const roleId = RoleId.create(input.id);
    const role = await this.repository.findById(roleId);
    if (!role) {
      throw new ApplicationError('Role not found', 404);
    }

    if (input.name && input.name !== role.name.value) {
      const name = RoleName.create(input.name);
      const existing = await this.repository.findByName(name);
      if (existing && existing.id.value !== role.id.value) {
        throw new ApplicationError('Role name already exists', 409);
      }
      role.rename(name);
    }

    if (
      input.canView !== undefined ||
      input.canCreate !== undefined ||
      input.canUpdate !== undefined ||
      input.canDelete !== undefined
    ) {
      const abilities = RoleAbilities.create({
        canView: input.canView ?? role.abilities.canView,
        canCreate: input.canCreate ?? role.abilities.canCreate,
        canUpdate: input.canUpdate ?? role.abilities.canUpdate,
        canDelete: input.canDelete ?? role.abilities.canDelete,
      });
      role.updateAbilities(abilities);
    }

    await this.repository.save(role);
    await this.eventBus.publishAll(role.pullDomainEvents());
    return role;
  }
}
