import { AuthorizationRequest } from '../../domain/auth/authorization-request';
import { AuthCode } from '../../domain/entities/auth-code';
import { Email } from '../../domain/value-objects/email';
import { ApplicationError } from '../errors/application-error';
import { AuthCodeGenerator } from '../ports/auth-code-generator';
import { AuthCodeRepository } from '../ports/auth-code-repository';
import { AuthSettings } from '../ports/auth-settings';
import { Clock } from '../ports/clock';
import { EventBus } from '../ports/event-bus';
import { PasswordHasher } from '../ports/password-hasher';
import { UserRepository } from '../ports/user-repository';

export interface LoginAndIssueCodeInput {
  authorizationRequest: AuthorizationRequest;
  email: string;
  password: string;
}

export class LoginAndIssueCodeUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly authCodeRepository: AuthCodeRepository,
    private readonly authCodeGenerator: AuthCodeGenerator,
    private readonly clock: Clock,
    private readonly settings: AuthSettings,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: LoginAndIssueCodeInput): Promise<string> {
    if (!input.email || !input.password) {
      throw new ApplicationError('Invalid credentials', 401);
    }

    const email = Email.create(input.email);
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new ApplicationError('Invalid credentials', 401);
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new ApplicationError('Invalid credentials', 401);
    }

    user.recordLogin();

    const code = this.authCodeGenerator.generate();
    const expiresAt = new Date(
      this.clock.now().getTime() + this.settings.authCodeTtlSeconds * 1000,
    );

    const authCode = AuthCode.issue({
      code,
      userId: user.id,
      clientId: input.authorizationRequest.clientId,
      redirectUri: input.authorizationRequest.redirectUri,
      scope: input.authorizationRequest.scope,
      expiresAt,
    });

    await this.authCodeRepository.save(authCode);
    await this.eventBus.publishAll(user.pullDomainEvents());
    return code;
  }
}
