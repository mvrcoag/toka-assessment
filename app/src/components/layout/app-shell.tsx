import { NavLink, Outlet } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AiChatWidget } from '@/components/ai/ai-chat-widget'
import { useAuth } from '@/hooks/use-auth'
import { useRoleOptions } from '@/hooks/use-role-options'
import {
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/roles', label: 'Roles', icon: ShieldCheck },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/audit', label: 'Audit', icon: ClipboardList },
  { to: '/ai', label: 'AI', icon: Sparkles },
]

export function AppShell() {
  const { user, logout } = useAuth()
  const { roles } = useRoleOptions()
  const roleLabel = roles.find((role) => role.id === user?.roleId)?.name ?? user?.roleId

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6 lg:flex-row">
        <aside className="hidden w-64 shrink-0 rounded-3xl border bg-white/80 p-6 shadow-sm backdrop-blur lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">Toka Control</p>
              <p className="text-sm text-muted-foreground">Service console</p>
            </div>
          </div>
          <Separator className="my-6" />
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  ].join(' ')
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Separator className="my-6" />
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Signed in</p>
            <p className="font-medium">{user?.name ?? 'Unknown user'}</p>
            <p className="text-xs text-muted-foreground">{user?.email ?? 'No email'}</p>
            {roleLabel ? <Badge variant="secondary">{roleLabel}</Badge> : null}
            <Button variant="outline" className="mt-3 w-full" onClick={logout}>
              Sign out
            </Button>
          </div>
        </aside>

        <main className="flex-1">
          <header className="flex flex-col gap-4 rounded-3xl border bg-white/80 p-6 shadow-sm backdrop-blur lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Toka Platform
              </p>
              <h1 className="text-2xl font-semibold text-foreground">Operations Hub</h1>
              <p className="text-sm text-muted-foreground">
                Monitor identities, permissions, audits, and AI connectivity.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => (
                <Button key={item.to} variant="outline" size="sm" className="lg:hidden" asChild>
                  <NavLink to={item.to}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                </Button>
              ))}
              <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs">
                <span className="font-medium">{user?.name ?? 'Unknown user'}</span>
                {roleLabel ? <Badge variant="secondary">{roleLabel}</Badge> : null}
                <Button variant="ghost" size="sm" onClick={logout}>
                  Sign out
                </Button>
              </div>
            </div>
          </header>
          <section className="page-enter mt-6">
            <Outlet />
          </section>
        </main>
      </div>
      <AiChatWidget />
    </div>
  )
}
