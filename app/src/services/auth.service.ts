import { API_BASE_URL, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_REDIRECT_URI } from '@/config'

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  idToken: string
}

export interface UserInfoResponse {
  sub: string
  name: string
  email: string
  role: string
}

export const authService = {
  buildAuthorizeUrl(scope = 'openid email profile') {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: OAUTH_CLIENT_ID,
      redirect_uri: OAUTH_REDIRECT_URI,
      scope,
    })
    return `${API_BASE_URL}/auth/oauth/authorize?${params.toString()}`
  },

  async exchangeCode(code: string): Promise<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: OAUTH_CLIENT_ID,
      client_secret: OAUTH_CLIENT_SECRET,
      redirect_uri: OAUTH_REDIRECT_URI,
    })

    const res = await fetch(`${API_BASE_URL}/auth/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}))
      throw new Error(payload.error ?? 'Error de autenticación')
    }

    const data = await res.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      idToken: data.id_token,
    }
  },

  async refresh(refreshToken: string): Promise<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: OAUTH_CLIENT_ID,
      client_secret: OAUTH_CLIENT_SECRET,
    })

    const res = await fetch(`${API_BASE_URL}/auth/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}))
      throw new Error(payload.error ?? 'Error al refrescar token')
    }

    const data = await res.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      idToken: data.id_token,
    }
  },

  async getUserInfo(accessToken: string): Promise<UserInfoResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}))
      throw new Error(payload.error ?? 'No se pudo obtener el usuario')
    }

    return res.json()
  },
}
