import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth-store'

export function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const fetchUser = useAuthStore((state) => state.fetchUser)
  const logoutStore = useAuthStore((state) => state.logout)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!accessToken || user || isLoading) {
      return
    }
    setIsLoading(true)
    fetchUser()
      .catch((error: Error) => {
        toast.error(error.message || 'Unable to load profile')
      })
      .finally(() => setIsLoading(false))
  }, [accessToken, user, fetchUser, isLoading])

  const login = () => {
    window.location.href = authService.buildAuthorizeUrl()
  }

  const logout = () => {
    void logoutStore()
  }

  return {
    accessToken,
    user,
    isAuthenticated: Boolean(accessToken),
    isLoading,
    login,
    logout,
  }
}
