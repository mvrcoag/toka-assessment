import { Email } from '../../domain/value-objects/email';
import { ApplicationError } from '../errors/application-error';
import { UserRepository } from '../ports/user-repository';

export class GetUserByEmailUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(email: string) {
    const emailValue = Email.create(email);
    const user = await this.repository.findByEmail(emailValue);
    if (!user) {
      throw new ApplicationError('User not found', 404);
    }

    return user;
  }
}
