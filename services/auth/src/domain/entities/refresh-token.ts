import { DomainError } from '../errors/domain-error';
import { Scope } from '../value-objects/scope';
import { UserId } from '../value-objects/user-id';

export interface RefreshTokenProps {
  tokenId: string;
  userId: UserId;
  clientId: string;
  scope: Scope;
  expiresAt: Date;
}

export class RefreshToken {
  private readonly props: RefreshTokenProps;

  private constructor(props: RefreshTokenProps) {
    this.props = props;
  }

  static issue(props: RefreshTokenProps): RefreshToken {
    if (!props.tokenId?.trim()) {
      throw new DomainError('Refresh token id is required');
    }

    return new RefreshToken(props);
  }

  get tokenId(): string {
    return this.props.tokenId;
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get clientId(): string {
    return this.props.clientId;
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
}
