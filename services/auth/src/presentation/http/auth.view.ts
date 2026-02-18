export interface LoginViewModel {
  clientId: string;
  redirectUri: string;
  scope: string;
  state?: string;
  nonce?: string;
  email?: string;
  error?: string;
}

export function renderLoginForm(model: LoginViewModel): string {
  const errorBlock = model.error
    ? `<div class="error">${escapeHtml(model.error)}</div>`
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sign in</title>
    <style>
      :root {
        color-scheme: light;
      }
      body {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif;
        background: linear-gradient(135deg, #f7f7f7, #f0f3f6);
        color: #1f2933;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .card {
        width: min(420px, 92vw);
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 24px 48px rgba(15, 23, 42, 0.15);
        padding: 32px;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 24px;
      }
      p {
        margin: 0 0 24px;
        color: #52606d;
      }
      label {
        display: block;
        font-weight: 600;
        margin-bottom: 6px;
      }
      input[type="email"],
      input[type="password"] {
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid #d9e2ec;
        margin-bottom: 16px;
      }
      button {
        width: 100%;
        padding: 12px 16px;
        border-radius: 10px;
        border: none;
        background: #0f172a;
        color: #ffffff;
        font-weight: 600;
        cursor: pointer;
      }
      .error {
        background: #fff1f2;
        border: 1px solid #fecdd3;
        color: #9f1239;
        padding: 10px 12px;
        border-radius: 10px;
        margin-bottom: 16px;
      }
      .meta {
        margin-top: 12px;
        font-size: 12px;
        color: #7b8794;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Sign in</h1>
      <p>Continue to ${escapeHtml(model.clientId)}</p>
      ${errorBlock}
      <form method="post" action="">
        <input type="hidden" name="client_id" value="${escapeHtml(model.clientId)}" />
        <input type="hidden" name="redirect_uri" value="${escapeHtml(model.redirectUri)}" />
        <input type="hidden" name="response_type" value="code" />
        <input type="hidden" name="scope" value="${escapeHtml(model.scope)}" />
        ${model.state ? `<input type="hidden" name="state" value="${escapeHtml(model.state)}" />` : ''}
        ${model.nonce ? `<input type="hidden" name="nonce" value="${escapeHtml(model.nonce)}" />` : ''}
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="email" value="${escapeHtml(model.email ?? '')}" required />
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required />
        <button type="submit">Sign in</button>
      </form>
      <div class="meta">OIDC Authorization Server</div>
    </div>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
