import { UserId } from '../../domain/value-objects/user-id';
import { ApplicationError } from '../errors/application-error';
import { UserRepository } from '../ports/user-repository';

export class GetUserUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(id: string) {
    const userId = UserId.create(id);
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new ApplicationError('User not found', 404);
    }

    return user;
  }
}
