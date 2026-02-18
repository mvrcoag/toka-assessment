import { RandomAuthCodeGenerator } from './random-auth-code.generator';

describe('RandomAuthCodeGenerator', () => {
  it('generates a hyphen-free code', () => {
    const generator = new RandomAuthCodeGenerator();
    const code = generator.generate();
    expect(code).toHaveLength(32);
    expect(code.includes('-')).toBe(false);
  });
});
