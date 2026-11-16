export interface Credentials {
  appId: string
  privateKey: string
}
export interface Envelope<T = unknown> {
  code: number
  msg?: string
  data?: T
}
export type Biz = Record<string, unknown>
