import { RoleId } from '../../domain/value-objects/role-id';
import { ApplicationError } from '../errors/application-error';
import { RoleRepository } from '../ports/role-repository';

export class GetRoleUseCase {
  constructor(private readonly repository: RoleRepository) {}

  async execute(id: string) {
    const roleId = RoleId.create(id);
    const role = await this.repository.findById(roleId);
    if (!role) {
      throw new ApplicationError('Role not found', 404);
    }

    return role;
  }
}
