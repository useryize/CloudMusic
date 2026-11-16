export interface Credentials {
  appId: string
  privateKey: string
  appSecret?: string
}
export interface Envelope<T = unknown> {
  code: number
  msg?: string
  message?: string
  subCode?: number | string | null
  comment?: unknown
  data?: T
}
export type Biz = Record<string, unknown>
