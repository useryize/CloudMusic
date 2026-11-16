import { create } from 'zustand'
export const useNotice = create<{
  message: string
  show: (message: string) => void
}>((set) => ({ message: '', show: (message) => set({ message }) }))
