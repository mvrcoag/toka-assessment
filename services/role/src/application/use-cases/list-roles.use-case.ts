import { RoleRepository } from '../ports/role-repository';

export class ListRolesUseCase {
  constructor(private readonly repository: RoleRepository) {}

  async execute() {
    return this.repository.list();
  }
}
