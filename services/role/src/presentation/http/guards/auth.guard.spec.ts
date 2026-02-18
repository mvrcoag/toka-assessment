import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const buildContext = (authorization?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization } }),
      }),
    }) as unknown as ExecutionContext;

  it('allows valid bearer token', async () => {
    const guard = new AuthGuard({
      verify: async () => ({ sub: 'user-1' }),
    } as any);
    await expect(guard.canActivate(buildContext('Bearer token'))).resolves.toBe(true);
  });

  it('rejects missing header', async () => {
    const guard = new AuthGuard({
      verify: async () => ({ sub: 'user-1' }),
    } as any);
    await expect(guard.canActivate(buildContext())).rejects.toBeDefined();
  });

  it('rejects invalid token', async () => {
    const guard = new AuthGuard({
      verify: async () => {
        throw new Error('bad');
      },
    } as any);
    await expect(guard.canActivate(buildContext('Bearer token'))).rejects.toBeDefined();
  });
});
