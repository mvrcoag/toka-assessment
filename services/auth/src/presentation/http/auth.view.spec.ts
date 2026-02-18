import { renderLoginForm } from './auth.view';

describe('renderLoginForm', () => {
  it('renders login form with hidden fields', () => {
    const html = renderLoginForm({
      clientId: 'client-1',
      redirectUri: 'http://localhost/callback',
      scope: 'openid email',
      state: 'state',
      nonce: 'nonce',
      email: 'user@toka.local',
    });

    expect(html).toContain('client-1');
    expect(html).toContain('redirect_uri');
    expect(html).toContain('openid email');
  });

  it('renders errors safely', () => {
    const html = renderLoginForm({
      clientId: 'client-1',
      redirectUri: 'http://localhost/callback',
      scope: 'openid',
      error: '<bad>',
    });

    expect(html).toContain('&lt;bad&gt;');
  });
});
