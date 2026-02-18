import { DomainError } from '../errors/domain-error';
import { Scope } from '../value-objects/scope';

export interface AuthorizationRequestProps {
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope: Scope;
  state?: string;
  nonce?: string;
}

export class AuthorizationRequest {
  private readonly props: AuthorizationRequestProps;

  private constructor(props: AuthorizationRequestProps) {
    this.props = props;
  }

  static fromQuery(query: Record<string, unknown>): AuthorizationRequest {
    const responseType = AuthorizationRequest.readString(query.response_type);
    const clientId = AuthorizationRequest.readString(query.client_id);
    const redirectUri = AuthorizationRequest.readString(query.redirect_uri);
    const scope = Scope.from(AuthorizationRequest.readScope(query.scope));
    const state = AuthorizationRequest.readOptionalString(query.state);
    const nonce = AuthorizationRequest.readOptionalString(query.nonce);

    if (responseType !== 'code') {
      throw new DomainError('Only response_type=code is supported');
    }

    if (!clientId) {
      throw new DomainError('client_id is required');
    }

    if (!redirectUri) {
      throw new DomainError('redirect_uri is required');
    }

    return new AuthorizationRequest({
      clientId,
      redirectUri,
      responseType,
      scope,
      state,
      nonce,
    });
  }

  get clientId(): string {
    return this.props.clientId;
  }

  get redirectUri(): string {
    return this.props.redirectUri;
  }

  get responseType(): string {
    return this.props.responseType;
  }

  get scope(): Scope {
    return this.props.scope;
  }

  get state(): string | undefined {
    return this.props.state;
  }

  get nonce(): string | undefined {
    return this.props.nonce;
  }

  private static readString(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }

    return value.trim();
  }

  private static readOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  private static readScope(value: unknown): string | string[] | undefined {
    if (Array.isArray(value)) {
      return value.filter((entry) => typeof entry === 'string') as string[];
    }

    if (typeof value === 'string') {
      return value;
    }

    return undefined;
  }
}
