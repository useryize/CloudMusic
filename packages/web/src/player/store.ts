import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Track } from '../api/types'
export type Quality = 'standard' | 'higher' | 'exhigh' | 'lossless'
export type Repeat = 'off' | 'all' | 'one'
interface PlayerPreferences {
  queue: Track[]
  index: number
  status: 'idle' | 'resolving' | 'playing' | 'paused' | 'ended' | 'error'
  currentTime: number
  duration: number
  shuffle: boolean
  quality: Quality
  error: string
  volume: number
  repeat: 'off' | 'all' | 'one'
  setVolume: (volume: number) => void
}
export const usePlayerPreferences = create<PlayerPreferences>()(
  persist(
    (set) => ({
      queue: [],
      index: -1,
      status: 'idle',
      currentTime: 0,
      duration: 0,
      shuffle: false,
      quality: 'exhigh',
      error: '',
      volume: 0.7,
      repeat: 'all',
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
    }),
    {
      name: 'cloudmusic-preferences',
      partialize: ({ volume, repeat, shuffle, quality }) => ({
        volume,
        repeat,
        shuffle,
        quality,
      }),
    },
  ),
)
export function nextIndex(
  index: number,
  length: number,
  repeat: Repeat,
  shuffle: boolean,
  direction = 1,
  random = Math.random,
) {
  if (!length) return -1
  if (shuffle && length > 1)
    return (index + 1 + Math.floor(random() * (length - 1))) % length
  const next = index + direction
  return next >= 0 && next < length
    ? next
    : repeat === 'all'
      ? (next + length) % length
      : -1
}
