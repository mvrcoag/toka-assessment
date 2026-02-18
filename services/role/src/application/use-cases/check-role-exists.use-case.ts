import { RoleId } from '../../domain/value-objects/role-id';
import { RoleRepository } from '../ports/role-repository';

export class CheckRoleExistsUseCase {
  constructor(private readonly repository: RoleRepository) {}

  async execute(id: string): Promise<boolean> {
    const roleId = RoleId.create(id);
    const role = await this.repository.findById(roleId);
    return Boolean(role);
  }
}
