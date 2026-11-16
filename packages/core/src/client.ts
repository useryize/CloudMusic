import { sign } from './signer.js'
import type { Biz, Credentials, Envelope } from './types.js'
import { DeviceParameterError } from './errors.js'
export const allowedPath = (path: string) =>
  (/^\/openapi\/(music|podcast|voice|mv)\/[a-zA-Z0-9/_-]+$/.test(path) ||
    [
      '/openapi/v1/resource/comments/add',
      '/openapi/v1/resource/comments/reply',
      '/openapi/search/multi/terminal/voicelist',
    ].includes(path)) &&
  !path.includes('//')
export interface CallOptions {
  device?: Record<string, string>
  token?: string
  deviceId?: string
  method?: 'GET' | 'POST'
}
export function createClient(
  getCredentials: () => Promise<Partial<Credentials>>,
  getContext: () => Promise<CallOptions> = async () => ({}),
  transport: typeof fetch = fetch,
) {
  let active = 0
  const queue: Array<() => void> = []
  const pending = new Map<string, Promise<Envelope>>()
  async function execute(
    path: string,
    biz: Biz,
    options: CallOptions,
  ): Promise<Envelope> {
    if (active >= 3) await new Promise<void>((resolve) => queue.push(resolve))
    active++
    try {
      const credentials = await getCredentials()
      const context = { ...(await getContext()), ...options }
      if (!credentials.appId || !credentials.privateKey)
        throw new Error('SETUP_REQUIRED')
      const device = { ...context.device, deviceId: context.deviceId }
      const params: Record<string, string> = {
        appId: credentials.appId,
        signType: 'RSA_SHA256',
        timestamp: String(Date.now()),
        device: JSON.stringify(device),
        bizContent: JSON.stringify(biz),
      }
      if (context.token) params.accessToken = context.token
      params.sign = sign(params, credentials.privateKey)
      const method = context.method ?? 'POST'
      const response = await transport(
        `https://openapi.music.163.com${path}${method === 'GET' ? '?' + new URLSearchParams(params).toString() : ''}`,
        {
          method,
          headers: { 'content-type': 'application/json' },
          body: method === 'POST' ? JSON.stringify(params) : undefined,
          signal: AbortSignal.timeout(10000),
          redirect: 'error',
        },
      )
      if (!response.ok) throw new Error(`UPSTREAM_${response.status}`)
      const result = (await response.json()) as Envelope
      const message = result.message || result.msg || ''
      if (
        result.code !== 200 &&
        (/公共参数校验失败/.test(message) ||
          (result.code === 2511 && /clientIp/.test(message)))
      )
        throw new DeviceParameterError(path, device)
      return result
    } finally {
      active--
      queue.shift()?.()
    }
  }
  return {
    call(path: string, biz: Biz = {}, options: CallOptions = {}) {
      if (!allowedPath(path)) return Promise.reject(new Error('INVALID_PATH'))
      const key = JSON.stringify([path, biz, options])
      // 写操作与播放地址必须独立请求，不能复用前一笔操作。
      if (
        /\/(playurl|comments|like|sub|unsub|record|oauth2)\//.test(path) ||
        path.endsWith('/record')
      )
        return execute(path, biz, options)
      const previous = pending.get(key)
      if (previous) return previous
      const task = execute(path, biz, options).finally(() =>
        pending.delete(key),
      )
      pending.set(key, task)
      return task
    },
  }
}
