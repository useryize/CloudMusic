import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './request'
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300000,
      refetchOnWindowFocus: false,
      retry: (count, error) =>
        count < 2 && (!(error instanceof ApiError) || error.code >= 500),
      retryDelay: (attempt) => 300 * 3 ** attempt,
    },
  },
})
