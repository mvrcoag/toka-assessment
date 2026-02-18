import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

export function CallbackPage() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')
  const navigate = useNavigate()
  const setTokens = useAuthStore((state) => state.setTokens)
  const fetchUser = useAuthStore((state) => state.fetchUser)
  const [error, setError] = useState<string | null>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    if (!code || hasRun.current) {
      if (!code) {
        setError('Missing authorization code')
      }
      return
    }
    hasRun.current = true
    authService
      .exchangeCode(code)
      .then((tokens) => setTokens(tokens))
      .then(() => fetchUser())
      .then(() => navigate('/dashboard', { replace: true }))
      .catch((err: Error) => {
        const message = err.message || 'Authentication failed'
        setError(message)
        toast.error(message)
      })
  }, [code, fetchUser, navigate, setTokens])

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-lg border bg-white/80 p-8 text-center shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Authenticating</p>
        <h1 className="mt-2 text-2xl font-semibold">Completing sign-in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ? 'We could not complete the login.' : 'Hang tight while we exchange your credentials.'}
        </p>
        {error ? (
          <Button className="mt-6" onClick={() => navigate('/login')}>Try again</Button>
        ) : (
          <div className="mt-6 flex justify-center">
            <div className="h-2 w-40 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-1/2 animate-pulse bg-primary" />
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
