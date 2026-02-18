import { GetJwksUseCase } from './get-jwks.use-case';

describe('GetJwksUseCase', () => {
  it('returns jwks from token service', async () => {
    const useCase = new GetJwksUseCase({
      issueAccessToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
      issueIdToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
      issueRefreshToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
      verifyAccessToken: async () => {
        throw new Error('not used');
      },
      verifyRefreshToken: async () => {
        throw new Error('not used');
      },
      getJwks: async () => ({ keys: [] }),
      getIssuer: () => 'issuer',
    });

    await expect(useCase.execute()).resolves.toEqual({ keys: [] });
  });
});
