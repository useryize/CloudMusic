import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { Biz, Credentials, Envelope } from './types.js'
import type { CallOptions } from './client.js'
import { PlatformError } from './errors.js'
export { PlatformError } from './errors.js'

type Call = (
  path: string,
  biz?: Biz,
  options?: CallOptions,
) => Promise<Envelope>
interface Session {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  kind: 'anonymous' | 'user'
}
interface TokenData {
  accessToken: string
  refreshToken?: string
  expireTime?: number
  expiresTime?: number
  expireIn?: number
}
export function unwrap<T>(result: Envelope): T {
  if (result.code !== 200)
    throw new PlatformError(
      result.code,
      result.message || result.msg || '开放平台请求失败',
    )
  return (result.data ?? result.comment) as T
}
export async function createTokenStore(
  dir: string,
  credentials: () => Promise<Partial<Credentials>>,
  call: Call,
) {
  await mkdir(dir, { recursive: true, mode: 0o700 })
  let deviceId: string
  try {
    deviceId = await readFile(join(dir, 'device-id'), 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    deviceId = randomUUID().replace(/-/g, '')
    await writeFile(join(dir, 'device-id'), deviceId, { mode: 0o600 })
  }
  if (deviceId.includes('-')) {
    deviceId = deviceId.replace(/-/g, '')
    await writeFile(join(dir, 'device-id'), deviceId, { mode: 0o600 })
  }
  let session: Session | undefined
  try {
    session = JSON.parse(
      await readFile(join(dir, 'session.json'), 'utf8'),
    ) as Session
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  let refreshing: Promise<void> | undefined
  let generation = 0
  let disk: Promise<void> = Promise.resolve()
  function persist(operation: () => Promise<void>) {
    const next = disk.catch(() => {}).then(operation)
    disk = next
    return next
  }
  let anonymous: Promise<string> | undefined
  let initializing: Promise<void> | undefined
  const qrKeys = new Map<string, { token: string; expires: number }>()
  async function save(
    data: TokenData,
    kind: Session['kind'],
    expected = generation,
  ) {
    if (expected !== generation)
      throw new PlatformError(401, '登录状态已改变，请重新登录')
    if (!data?.accessToken || data.accessToken === 'null')
      throw new PlatformError(502, '平台未返回有效登录凭证')
    const expires = Number(data.expireTime ?? data.expiresTime ?? data.expireIn)
    session = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt:
        kind === 'user' && expires > 0
          ? Date.now() + expires * 1000
          : undefined,
      kind,
    }
    const serialized = JSON.stringify(session)
    await persist(async () => {
      if (expected === generation)
        await writeFile(join(dir, 'session.json'), serialized, { mode: 0o600 })
    })
  }
  async function getAnonymous() {
    if (session?.kind === 'anonymous') return session.accessToken
    anonymous ??= (async () => {
      const c = await credentials()
      return unwrap<TokenData>(
        await call(
          '/openapi/music/basic/oauth2/login/anonymous',
          { clientId: c.appId },
          { token: '', deviceId },
        ),
      ).accessToken
    })().finally(() => {
      anonymous = undefined
    })
    return anonymous
  }
  async function refresh() {
    if (!refreshing)
      refreshing = (async () => {
        const expected = generation
        const c = await credentials()
        if (!session?.refreshToken || !c.appSecret)
          throw new PlatformError(
            401,
            '登录已过期，请重新扫码；配置 AppSecret 后可自动续期',
          )
        const data = unwrap<TokenData>(
          await call(
            '/openapi/music/basic/user/oauth2/token/refresh/v2',
            {
              clientId: c.appId,
              clientSecret: c.appSecret,
              refreshToken: session.refreshToken,
            },
            { token: session.accessToken, deviceId },
          ),
        )
        await save(data, 'user', expected)
      })().finally(() => {
        refreshing = undefined
      })
    await refreshing
  }
  return {
    deviceId,
    status: () => ({
      loggedIn: session?.kind === 'user',
      anonymous: session?.kind === 'anonymous',
    }),
    context: async () => ({ token: session?.accessToken, deviceId }),
    async request(
      path: string,
      biz: Biz = {},
      method: 'GET' | 'POST' = 'POST',
    ) {
      if (!session && !path.endsWith('/search/hot/keyword/get/v2')) {
        initializing ??= (async () => {
          const expected = generation
          const accessToken = await getAnonymous()
          if (!session) await save({ accessToken }, 'anonymous', expected)
        })().finally(() => {
          initializing = undefined
        })
        await initializing
      }
      if (
        session?.kind === 'user' &&
        session.expiresAt &&
        session.expiresAt < Date.now() + 60000
      )
        await refresh()
      let result = await call(path, biz, {
        token: session?.accessToken,
        deviceId,
        method,
      })
      if ([1406, 1408].includes(result.code) && session?.kind === 'user') {
        await refresh()
        result = await call(path, biz, {
          token: session?.accessToken,
          deviceId,
          method,
        })
      }
      return result
    },
    async anonymous() {
      const expected = generation
      await save({ accessToken: await getAnonymous() }, 'anonymous', expected)
      return { ok: true }
    },
    async qrcode() {
      const expected = generation
      const token = await getAnonymous()
      const data = unwrap<{ uniKey: string; qrCodeUrl: string }>(
        await call(
          '/openapi/music/basic/user/oauth2/qrcodekey/get/v2',
          { type: 2, expiredKey: '300' },
          { token, deviceId },
        ),
      )
      if (expected !== generation)
        throw new PlatformError(401, '登录状态已改变，请重试')
      for (const [key, value] of qrKeys)
        if (value.expires < Date.now()) qrKeys.delete(key)
      if (qrKeys.size >= 10) qrKeys.delete(qrKeys.keys().next().value!)
      qrKeys.set(data.uniKey, { token, expires: Date.now() + 300000 })
      return { key: data.uniKey, qrUrl: data.qrCodeUrl, expiresIn: 300 }
    },
    async poll(key: string) {
      const expected = generation
      const qr = qrKeys.get(key)
      if (!qr || qr.expires < Date.now())
        return { status: 800, msg: '二维码已过期' }
      const c = await credentials()
      const data = unwrap<{
        status: number
        msg: string
        accessToken?: TokenData
      }>(
        await call(
          '/openapi/music/basic/oauth2/device/login/qrcode/get',
          { key, clientId: c.appId },
          { token: qr.token, deviceId },
        ),
      )
      if (data.status === 803 && data.accessToken) {
        await save(data.accessToken, 'user', expected)
        qrKeys.clear()
      }
      return { status: data.status, msg: data.msg }
    },
    async logout() {
      generation++
      session = undefined
      qrKeys.clear()
      await persist(() =>
        unlink(join(dir, 'session.json')).catch((error) => {
          if (error.code !== 'ENOENT') throw error
        }),
      )
      return { ok: true }
    },
  }
}
