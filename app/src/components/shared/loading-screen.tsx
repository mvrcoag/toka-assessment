import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface LoadingScreenProps {
  label?: string
}

export function LoadingScreen({ label = 'Loading' }: LoadingScreenProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md border-dashed bg-white/80 p-6 text-center shadow-sm">
        <div className="space-y-4">
          <Skeleton className="mx-auto h-12 w-12 rounded-2xl" />
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">Please wait a moment</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
