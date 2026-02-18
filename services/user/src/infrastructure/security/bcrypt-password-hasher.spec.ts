import { BcryptPasswordHasher } from './bcrypt-password-hasher';

describe('BcryptPasswordHasher', () => {
  it('hashes passwords', async () => {
    const hasher = new BcryptPasswordHasher(4);
    const hash = await hasher.hash('secret');
    expect(hash.value).toBeDefined();
    expect(hash.value).not.toBe('secret');
  });
});
