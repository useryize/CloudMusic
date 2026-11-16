import { localApi } from '../api/user'
import type { Quality } from './store'
export interface ResolvedAudio {
  src: string
  bitrate?: number
  duration?: number
  freeTrail?: { start: number; end: number }
  openApiTraceInfo?: string
}
export const resolveAudio = (songId: string, quality: Quality) =>
  localApi<ResolvedAudio>('/api/playback/resolve', {
    songId,
    bitrate: { standard: 128, higher: 192, exhigh: 320, lossless: 999 }[
      quality
    ],
  })
