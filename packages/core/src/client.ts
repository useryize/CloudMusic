import { sign } from './signer.js'
import type { Biz, Credentials, Envelope } from './types.js'
export const allowedPath = (path: string) =>
  /^\/openapi\/(music|podcast|voice|mv)\/[a-zA-Z0-9/_-]+$/.test(path) &&
  !path.includes('//')
export function createClient(
  getCredentials: () => Promise<Partial<Credentials>>,
) {
  let active = 0
  const queue: Array<() => void> = []
  const pending = new Map<string, Promise<Envelope>>()
  async function execute(path: string, biz: Biz): Promise<Envelope> {
    if (active >= 3) await new Promise<void>((resolve) => queue.push(resolve))
    active++
    try {
      const credentials = await getCredentials()
      if (!credentials.appId || !credentials.privateKey)
        throw new Error('SETUP_REQUIRED')
      const params: Record<string, string> = {
        appId: credentials.appId,
        signType: 'RSA_SHA256',
        timestamp: String(Date.now()),
        device: JSON.stringify({
          channel: 'cloudmusic-pc',
          deviceType: 'openapi',
          os: 'openapi',
          appVer: '1.0.0',
        }),
        bizContent: JSON.stringify(biz),
      }
      params.sign = sign(params, credentials.privateKey)
      const response = await fetch(`https://openapi.music.163.com${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(10000),
        redirect: 'error',
      })
      if (!response.ok) throw new Error(`UPSTREAM_${response.status}`)
      return (await response.json()) as Envelope
    } finally {
      active--
      queue.shift()?.()
    }
  }
  return {
    call(path: string, biz: Biz = {}) {
      if (!allowedPath(path)) return Promise.reject(new Error('INVALID_PATH'))
      const key = JSON.stringify([path, biz])
      const previous = pending.get(key)
      if (previous) return previous
      const task = execute(path, biz).finally(() => pending.delete(key))
      pending.set(key, task)
      return task
    },
  }
}
