import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const buildContext = (authorization?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization } }),
      }),
    }) as any;

  it('accepts valid bearer token', async () => {
    const verifier = { verify: jest.fn(async () => ({ sub: 'user-1' })) } as any;
    const guard = new AuthGuard(verifier);
    await expect(guard.canActivate(buildContext('Bearer token'))).resolves.toBe(true);
    expect(verifier.verify).toHaveBeenCalled();
  });

  it('rejects missing header', async () => {
    const verifier = { verify: jest.fn() } as any;
    const guard = new AuthGuard(verifier);
    await expect(guard.canActivate(buildContext(undefined))).rejects.toBeDefined();
  });

  it('rejects invalid scheme', async () => {
    const verifier = { verify: jest.fn() } as any;
    const guard = new AuthGuard(verifier);
    await expect(guard.canActivate(buildContext('Basic token'))).rejects.toBeDefined();
  });
});
