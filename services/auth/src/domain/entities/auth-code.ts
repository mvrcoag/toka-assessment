import { DomainError } from '../errors/domain-error';
import { Scope } from '../value-objects/scope';
import { UserId } from '../value-objects/user-id';

export interface AuthCodeProps {
  code: string;
  userId: UserId;
  clientId: string;
  redirectUri: string;
  scope: Scope;
  expiresAt: Date;
}

export class AuthCode {
  private readonly props: AuthCodeProps;

  private constructor(props: AuthCodeProps) {
    this.props = props;
  }

  static issue(props: AuthCodeProps): AuthCode {
    if (!props.code?.trim()) {
      throw new DomainError('Authorization code is required');
    }

    return new AuthCode(props);
  }

  get code(): string {
    return this.props.code;
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get clientId(): string {
    return this.props.clientId;
  }

  get redirectUri(): string {
    return this.props.redirectUri;
  }

  get scope(): Scope {
    return this.props.scope;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  isExpired(now: Date): boolean {
    return now.getTime() >= this.props.expiresAt.getTime();
  }

  matches(clientId: string, redirectUri: string): boolean {
    return this.props.clientId === clientId && this.props.redirectUri === redirectUri;
  }
}
