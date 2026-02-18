import { SystemClock } from './system-clock';

describe('SystemClock', () => {
  it('returns current date', () => {
    const clock = new SystemClock();
    const now = clock.now();
    expect(now).toBeInstanceOf(Date);
  });
});
