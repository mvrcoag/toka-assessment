import { AuthController } from './auth.controller';
import { AuthorizationRequest } from '../../domain/auth/authorization-request';
import { ApplicationError } from '../../application/errors/application-error';

describe('AuthController', () => {
  const authRequest = AuthorizationRequest.fromQuery({
    response_type: 'code',
    client_id: 'client-1',
    redirect_uri: 'http://localhost/callback',
    scope: 'openid email',
  });

  const buildRes = () => {
    const res: any = {
      type: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
    };
    return res;
  };

  it('renders login form on authorize GET', async () => {
    const controller = new AuthController(
      { execute: async () => authRequest } as any,
      { execute: async () => 'code' } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => undefined } as any,
    );
    const res = buildRes();

    await controller.showLogin(
      {
        response_type: 'code',
        client_id: 'client-1',
        redirect_uri: 'http://localhost/callback',
        scope: 'openid email',
      },
      res,
    );

    expect(res.send).toHaveBeenCalled();
  });

  it('returns json error when authorize GET fails before request', async () => {
    const controller = new AuthController(
      { execute: async () => { throw new ApplicationError('bad'); } } as any,
      { execute: async () => 'code' } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => undefined } as any,
    );
    const res = buildRes();

    await controller.showLogin(
      {
        response_type: 'code',
        client_id: 'client-1',
        redirect_uri: 'http://localhost/callback',
        scope: 'openid email',
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it('redirects after successful login', async () => {
    const controller = new AuthController(
      { execute: async () => authRequest } as any,
      { execute: async () => 'code-123' } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => undefined } as any,
    );
    const res = buildRes();

    await controller.handleLogin(
      {
        response_type: 'code',
        client_id: 'client-1',
        redirect_uri: 'http://localhost/callback',
        scope: 'openid email',
        email: 'user@toka.local',
        password: 'secret',
      },
      res,
    );

    expect(res.redirect).toHaveBeenCalled();
  });

  it('returns login form on error during POST', async () => {
    const controller = new AuthController(
      { execute: async () => authRequest } as any,
      { execute: async () => { throw new ApplicationError('bad'); } } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => undefined } as any,
    );
    const res = buildRes();

    await controller.handleLogin(
      {
        response_type: 'code',
        client_id: 'client-1',
        redirect_uri: 'http://localhost/callback',
        scope: 'openid email',
        email: 'user@toka.local',
        password: 'secret',
      },
      res,
    );

    expect(res.type).toHaveBeenCalledWith('html');
    expect(res.send).toHaveBeenCalled();
  });

  it('handles token grant exchanges', async () => {
    const controller = new AuthController(
      { execute: async () => authRequest } as any,
      { execute: async () => 'code-123' } as any,
      { execute: async () => ({ accessToken: 'a', idToken: 'i', refreshToken: 'r', tokenType: 'Bearer', expiresIn: 1 }) } as any,
      { execute: async () => ({ accessToken: 'a2', idToken: 'i2', refreshToken: 'r2', tokenType: 'Bearer', expiresIn: 1 }) } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => undefined } as any,
    );

    const authCodeTokens = await controller.token({
      grant_type: 'authorization_code',
      code: 'code',
      client_id: 'client-1',
      client_secret: 'secret',
      redirect_uri: 'http://localhost/callback',
    });
    expect(authCodeTokens.access_token).toBe('a');

    const refreshTokens = await controller.token({
      grant_type: 'refresh_token',
      refresh_token: 'refresh',
      client_id: 'client-1',
      client_secret: 'secret',
    });
    expect(refreshTokens.refresh_token).toBe('r2');
  });

  it('throws for invalid grant type', async () => {
    const controller = new AuthController(
      { execute: async () => authRequest } as any,
      { execute: async () => 'code-123' } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => undefined } as any,
    );

    await expect(
      controller.token({
        grant_type: 'password',
        client_id: 'client-1',
        client_secret: 'secret',
      } as any),
    ).rejects.toBeDefined();
  });

  it('returns user info from bearer token', async () => {
    const controller = new AuthController(
      { execute: async () => authRequest } as any,
      { execute: async () => 'code-123' } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => ({ sub: 'user-1' }) } as any,
      { execute: async () => undefined } as any,
    );

    await expect(controller.userInfo('Bearer token')).resolves.toEqual({ sub: 'user-1' });
  });

  it('throws when authorization header is missing', async () => {
    const controller = new AuthController(
      { execute: async () => authRequest } as any,
      { execute: async () => 'code-123' } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => ({}) } as any,
      { execute: async () => ({ sub: 'user-1' }) } as any,
      { execute: async () => undefined } as any,
    );

    await expect(controller.userInfo()).rejects.toBeDefined();
  });
});
