import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { aiService } from '@/services/ai.service'

export function useAiGreeting() {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<Record<string, string> | null>(null)

  const loadGreeting = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await aiService.hello()
      setResponse(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach AI service'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { isLoading, response, loadGreeting }
}
