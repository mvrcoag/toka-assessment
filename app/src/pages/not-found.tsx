import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-lg border bg-white/80 p-8 text-center shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lost page</p>
        <h1 className="mt-2 text-2xl font-semibold">We could not find that route</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Check the URL or return to the dashboard to continue.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </Card>
    </div>
  )
}
