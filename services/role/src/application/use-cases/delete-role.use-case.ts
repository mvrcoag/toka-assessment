import { RoleId } from '../../domain/value-objects/role-id';
import { ApplicationError } from '../errors/application-error';
import { EventBus } from '../ports/event-bus';
import { RoleRepository } from '../ports/role-repository';

export class DeleteRoleUseCase {
  constructor(
    private readonly repository: RoleRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(id: string): Promise<void> {
    const roleId = RoleId.create(id);
    const role = await this.repository.findById(roleId);
    if (!role) {
      throw new ApplicationError('Role not found', 404);
    }

    role.markDeleted();
    await this.repository.delete(role);
    await this.eventBus.publishAll(role.pullDomainEvents());
  }
}
