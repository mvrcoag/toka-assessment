import { WellKnownController } from './well-known.controller';

describe('WellKnownController', () => {
  it('returns configuration and jwks', async () => {
    const controller = new WellKnownController(
      { execute: () => ({ issuer: 'http://issuer' }) } as any,
      { execute: async () => ({ keys: [] }) } as any,
    );

    expect(controller.openIdConfiguration()).toEqual({ issuer: 'http://issuer' });
    await expect(controller.jwks()).resolves.toEqual({ keys: [] });
    await expect(controller.legacyJwks()).resolves.toEqual({ keys: [] });
  });
});
