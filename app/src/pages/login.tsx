import { Navigate, useLocation } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import { Sparkles } from 'lucide-react'

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-3xl overflow-hidden border bg-white/80 shadow-lg backdrop-blur">
        <div className="grid gap-8 p-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Toka Platform</p>
                <h1 className="text-2xl font-semibold">Operations Console</h1>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Secure access to the identity, role, audit, and AI services powering your stack.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Roles & permissions</Badge>
              <Badge variant="secondary">User onboarding</Badge>
              <Badge variant="secondary">Audit trail</Badge>
              <Badge variant="secondary">AI connectivity</Badge>
            </div>
            <Separator />
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Sign in with your authorized credentials to continue.</p>
              <p>Access tokens are stored in session scope and refreshed automatically.</p>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-2xl border bg-background p-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Welcome back</p>
              <h2 className="text-xl font-semibold">Authentication required</h2>
              <p className="text-sm text-muted-foreground">
                Continue to your destination to start managing services.
              </p>
            </div>
            <Button className="mt-6 w-full" onClick={login}>
              Sign in to continue
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
