import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAiGreeting } from '@/hooks/use-ai'
import { Sparkles } from 'lucide-react'

export function AiPage() {
  const { isLoading, response, loadGreeting } = useAiGreeting()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">AI</p>
        <h2 className="text-2xl font-semibold">Service handshake</h2>
      </div>

      <Card className="border bg-white/80 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">AI endpoint check</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Trigger a sample request to the AI service and verify connectivity.
            </p>
          </div>
          <Button onClick={loadGreeting} disabled={isLoading}>
            {isLoading ? 'Checking...' : 'Run check'}
          </Button>
        </div>
        <Separator className="my-4" />
        <div className="rounded-xl border bg-background p-4 text-sm">
          {response ? (
            <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(response, null, 2)}</pre>
          ) : (
            <p className="text-muted-foreground">No response yet. Trigger a check to see output.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
