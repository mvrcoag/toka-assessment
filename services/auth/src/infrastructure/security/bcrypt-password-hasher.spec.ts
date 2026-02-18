import { BcryptPasswordHasher } from './bcrypt-password-hasher';

describe('BcryptPasswordHasher', () => {
  it('hashes and compares passwords', async () => {
    const hasher = new BcryptPasswordHasher(4);
    const hash = await hasher.hash('secret');
    const matches = await hasher.compare('secret', hash);
    const wrong = await hasher.compare('wrong', hash);
    expect(matches).toBe(true);
    expect(wrong).toBe(false);
  });
});
