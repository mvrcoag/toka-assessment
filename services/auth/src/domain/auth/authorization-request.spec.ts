import { DomainError } from '../errors/domain-error';
import { AuthorizationRequest } from './authorization-request';

describe('AuthorizationRequest', () => {
  it('parses a valid query', () => {
    const request = AuthorizationRequest.fromQuery({
      response_type: 'code',
      client_id: 'client-1',
      redirect_uri: 'http://localhost/callback',
      scope: 'openid email',
      state: 'state123',
      nonce: 'nonce123',
    });

    expect(request.clientId).toBe('client-1');
    expect(request.redirectUri).toBe('http://localhost/callback');
    expect(request.scope.toString()).toBe('openid email');
    expect(request.state).toBe('state123');
    expect(request.nonce).toBe('nonce123');
  });

  it('throws when response type is unsupported', () => {
    expect(() =>
      AuthorizationRequest.fromQuery({
        response_type: 'token',
        client_id: 'client-1',
        redirect_uri: 'http://localhost/callback',
        scope: 'openid',
      }),
    ).toThrow(DomainError);
  });

  it('throws when required fields are missing', () => {
    expect(() =>
      AuthorizationRequest.fromQuery({
        response_type: 'code',
        redirect_uri: 'http://localhost/callback',
        scope: 'openid',
      }),
    ).toThrow(DomainError);
  });

  it('throws when redirect uri is missing', () => {
    expect(() =>
      AuthorizationRequest.fromQuery({
        response_type: 'code',
        client_id: 'client-1',
        scope: 'openid',
      }),
    ).toThrow(DomainError);
  });

  it('returns undefined when scope is not a string', () => {
    const request = AuthorizationRequest.fromQuery({
      response_type: 'code',
      client_id: 'client-1',
      redirect_uri: 'http://localhost/callback',
      scope: 123,
    });
    expect(request.responseType).toBe('code');
  });

  it('accepts array scope', () => {
    const request = AuthorizationRequest.fromQuery({
      response_type: 'code',
      client_id: 'client-1',
      redirect_uri: 'http://localhost/callback',
      scope: ['openid', 'email'],
    });

    expect(request.scope.toString()).toBe('openid email');
  });
});
