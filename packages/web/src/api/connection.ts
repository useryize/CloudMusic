import { useQuery } from '@tanstack/react-query'
import { localApi } from './user'
export function useConnection() {
  return useQuery({
    queryKey: ['connection'],
    queryFn: () =>
      localApi<{
        backend: 'cli' | 'direct'
        supports: Record<string, boolean>
      }>('/api/connection'),
    staleTime: Infinity,
  })
}
