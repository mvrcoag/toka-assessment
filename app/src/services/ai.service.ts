import { request } from '@/services/http'

export const aiService = {
  hello: () => request<Record<string, string>>('/ai/'),
}
