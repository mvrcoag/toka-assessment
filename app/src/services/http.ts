import { API_BASE_URL } from '@/config'
import { useAuthStore } from '@/stores/auth-store'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  headers?: Record<string, string>
  auth?: boolean
  retry?: boolean
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers, auth = true, retry = true } = options
  const token = useAuthStore.getState().accessToken

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && auth && retry) {
    const refreshed = await useAuthStore.getState().refreshTokens()
    if (refreshed) {
      return request<T>(path, { ...options, retry: false })
    }
  }

  if (!res.ok) {
    const payload = await safeJson(res)
    const message = payload?.error ?? payload?.message ?? res.statusText
    throw new Error(message)
  }

  return safeJson(res)
}

async function safeJson(res: Response) {
  const text = await res.text()
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
