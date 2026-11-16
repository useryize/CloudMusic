import { create } from 'zustand'
import { persist } from 'zustand/middleware'
interface PlayerPreferences {
  volume: number
  repeat: 'off' | 'all' | 'one'
  setVolume: (volume: number) => void
}
export const usePlayerPreferences = create<PlayerPreferences>()(
  persist(
    (set) => ({
      volume: 0.7,
      repeat: 'all',
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
    }),
    { name: 'cloudmusic-preferences' },
  ),
)
