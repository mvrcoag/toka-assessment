export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const OAUTH_CLIENT_ID =
  import.meta.env.VITE_OAUTH_CLIENT_ID ?? 'toka-client'

export const OAUTH_CLIENT_SECRET =
  import.meta.env.VITE_OAUTH_CLIENT_SECRET ?? 'toka-secret'

export const OAUTH_REDIRECT_URI =
  import.meta.env.VITE_OAUTH_REDIRECT_URI ??
  'http://localhost:3000/callback'
