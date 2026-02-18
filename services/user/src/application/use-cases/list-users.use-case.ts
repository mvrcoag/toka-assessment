import { UserRepository } from '../ports/user-repository';

export class ListUsersUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute() {
    return this.repository.list();
  }
}
