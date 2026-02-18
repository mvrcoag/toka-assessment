import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authService } from '@/services/auth.service'

export interface AuthUser {
  sub: string
  name: string
  email: string
  roleId: string
  roleAbilities?: {
    canView?: boolean
    canCreate?: boolean
    canUpdate?: boolean
    canDelete?: boolean
  }
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  idToken: string | null
  user: AuthUser | null
  isRefreshing: boolean
  setTokens: (tokens: {
    accessToken: string
    refreshToken: string
    idToken: string
  }) => void
  clear: () => void
  fetchUser: () => Promise<void>
  refreshTokens: () => Promise<boolean>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      idToken: null,
      user: null,
      isRefreshing: false,
      setTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          idToken: tokens.idToken,
        }),
      clear: () => set({ accessToken: null, refreshToken: null, idToken: null, user: null }),
      fetchUser: async () => {
        const accessToken = get().accessToken
        if (!accessToken) {
          return
        }
        const user = await authService.getUserInfo(accessToken)
        set({ user })
      },
      refreshTokens: async () => {
        const refreshToken = get().refreshToken
        if (!refreshToken || get().isRefreshing) {
          return false
        }
        set({ isRefreshing: true })
        try {
          const tokens = await authService.refresh(refreshToken)
          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            idToken: tokens.idToken,
            isRefreshing: false,
          })
          return true
        } catch {
          set({ isRefreshing: false })
          get().clear()
          return false
        }
      },
      logout: async () => {
        const accessToken = get().accessToken
        const refreshToken = get().refreshToken
        if (accessToken) {
          try {
            await authService.logout(accessToken, refreshToken)
          } catch {
            // Ignore logout errors and clear local state.
          }
        }
        get().clear()
      },
    }),
    {
      name: 'toka-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        idToken: state.idToken,
      }),
    },
  ),
)
