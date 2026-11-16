import { it, expect, vi } from 'vitest'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createTokenStore } from './token'
import type { Envelope } from './types'
it('退出登录后，飞行中的扫码结果不能恢复旧会话', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cm-logout-'))
  let finish!: (value: Envelope) => void
  const call = async (path: string): Promise<Envelope> =>
    path.endsWith('/anonymous')
      ? { code: 200, data: { accessToken: 'anon' } }
      : path.endsWith('/get/v2')
        ? {
            code: 200,
            data: { uniKey: 'key', qrCodeUrl: 'https://music.163.com/login' },
          }
        : new Promise((resolve) => {
            finish = resolve
          })
  try {
    const store = await createTokenStore(
      dir,
      async () => ({ appId: 'app' }),
      call,
    )
    await store.qrcode()
    const polling = store.poll('key')
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'))
    await store.logout()
    finish({
      code: 200,
      data: { status: 803, accessToken: { accessToken: 'user' } },
    })
    await expect(polling).rejects.toThrow('登录状态已改变')
    expect(store.status().loggedIn).toBe(false)
    await expect(readFile(join(dir, 'session.json'))).rejects.toMatchObject({
      code: 'ENOENT',
    })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
it('匿名浏览只初始化一次会话，随后请求使用服务端 Token', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cm-guest-'))
  const call = vi.fn(
    async (
      path: string,
      _biz?: unknown,
      options?: { token?: string },
    ): Promise<Envelope> =>
      path.endsWith('/anonymous')
        ? { code: 200, data: { accessToken: 'guest' } }
        : { code: 200, data: { hasToken: options?.token === 'guest' } },
  )
  try {
    const store = await createTokenStore(
      dir,
      async () => ({ appId: 'app' }),
      call,
    )
    const results = await Promise.all([
      store.request('/openapi/music/a'),
      store.request('/openapi/music/b'),
    ])
    expect(
      results.every((r) => (r.data as { hasToken: boolean }).hasToken),
    ).toBe(true)
    expect(
      call.mock.calls.filter(([path]) => path.endsWith('/anonymous')),
    ).toHaveLength(1)
    expect(store.status()).toEqual({ loggedIn: false, anonymous: true })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
it('匿名轮询扫码，Token 仅落服务端，重启后保持登录与设备 ID', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cm-auth-'))
  const call = vi.fn(async (path: string): Promise<Envelope> => ({
    code: 200,
    data: path.endsWith('/anonymous')
      ? { accessToken: 'anon-token' }
      : path.endsWith('/get/v2')
        ? { uniKey: 'qr-key', qrCodeUrl: 'https://music.163.com/login' }
        : {
            status: 803,
            msg: '成功',
            accessToken: {
              accessToken: 'user-token',
              refreshToken: 'refresh-token',
              expireTime: 604800,
            },
          },
  }))
  try {
    const store = await createTokenStore(
      dir,
      async () => ({ appId: 'app' }),
      call,
    )
    const qr = await store.qrcode()
    expect(JSON.stringify(qr)).not.toContain('anon-token')
    const result = await store.poll(qr.key)
    expect(result).toEqual({ status: 803, msg: '成功' })
    expect(store.status().loggedIn).toBe(true)
    const saved = JSON.parse(
      await readFile(join(dir, 'session.json'), 'utf8'),
    ) as { accessToken: string }
    expect(saved.accessToken).toBe('user-token')
    const next = await createTokenStore(dir, async () => ({}), call)
    expect(next.deviceId).toBe(store.deviceId)
    expect(next.status().loggedIn).toBe(true)
    await next.logout()
    expect(next.status().loggedIn).toBe(false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
it('并发过期请求只续期一次，重放时使用新 Token', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cm-refresh-'))
  await writeFile(
    join(dir, 'session.json'),
    JSON.stringify({
      accessToken: 'old',
      refreshToken: 'refresh',
      expiresAt: Date.now() + 3600000,
      kind: 'user',
    }),
  )
  const call = vi.fn(
    async (
      path: string,
      _biz?: unknown,
      options?: { token?: string },
    ): Promise<Envelope> => {
      if (path.includes('/refresh/')) {
        await new Promise((r) => setTimeout(r, 10))
        return {
          code: 200,
          data: {
            accessToken: 'new',
            refreshToken: 'next',
            expiresTime: 604800,
          },
        }
      }
      return options?.token === 'old' ? { code: 1406 } : { code: 200, data: [] }
    },
  )
  try {
    const store = await createTokenStore(
      dir,
      async () => ({ appId: 'app', appSecret: 'secret' }),
      call,
    )
    await Promise.all([
      store.request('/openapi/music/a'),
      store.request('/openapi/music/b'),
    ])
    expect(
      call.mock.calls.filter(([path]) => path.includes('/refresh/')),
    ).toHaveLength(1)
    expect((await store.context()).token).toBe('new')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
