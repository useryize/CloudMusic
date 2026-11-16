import type { Biz, Envelope } from '@cloudmusic/core'
export interface Gateway {
  player?: {
    action(command: {
      action: 'play' | 'pause' | 'resume' | 'stop' | 'seek' | 'volume'
      songId?: string
      originalId?: string
      value?: number
    }): Promise<{ ok: boolean }>
    status(): Promise<{ status: string; position: number }>
  }
  status():
    | { loggedIn: boolean; anonymous: boolean }
    | Promise<{ loggedIn: boolean; anonymous: boolean }>
  qrcode(): Promise<{ key: string; qrUrl: string; expiresIn: number }>
  poll(key: string): Promise<{ status: number; msg: string }>
  anonymous(): Promise<{ ok: boolean }>
  logout(): Promise<{ ok: boolean }>
  request(path: string, biz?: Biz, method?: 'GET' | 'POST'): Promise<Envelope>
}
