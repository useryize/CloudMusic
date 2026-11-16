import { it, expect } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startServer } from './index'
it('保护本地服务、交换 Cookie，凭证缺失时引导配置', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cm-test-'))
  const server = await startServer({ dataDir: dir })
  const host = `127.0.0.1:${server.port}`
  const inject = (url: string, headers = {}) =>
    server.app.inject({ url, headers: { host, ...headers } })
  try {
    expect((await inject('/api/health')).statusCode).toBe(200)
    expect((await inject('/api/health', { host: 'evil.com' })).statusCode).toBe(
      403,
    )
    expect(
      (await inject('/api/setup', { origin: 'https://evil.com' })).statusCode,
    ).toBe(403)
    expect(
      (await inject('/api/setup', { 'sec-fetch-site': 'cross-site' }))
        .statusCode,
    ).toBe(403)
    expect((await inject('/')).body).toContain('启动链接')
    expect((await inject('/api/setup')).statusCode).toBe(401)
    const exchange = await inject(`/?t=${server.token}`)
    expect(exchange.statusCode).toBe(302)
    expect(exchange.headers['set-cookie']).toContain('HttpOnly')
    const headers = { host, cookie: `cm_token=${server.token}` }
    expect(
      (
        await server.app.inject({
          url: '/api/rpc',
          method: 'POST',
          headers,
          payload: { path: '/etc/passwd' },
        })
      ).statusCode,
    ).toBe(400)
    expect(
      (
        await server.app.inject({
          url: '/api/rpc',
          method: 'POST',
          headers,
          payload: { path: '/openapi/music/basic/search/hot/keyword/get/v2' },
        })
      ).statusCode,
    ).toBe(409)
    expect(
      (
        await server.app.inject({
          url: '/api/setup',
          method: 'POST',
          headers,
          payload: { appId: 'demo', privateKey: 'invalid' },
        })
      ).statusCode,
    ).toBe(400)
    expect(
      (await inject('/api/setup', { 'x-app-token': server.token })).json(),
    ).toEqual({ configured: false })
  } finally {
    await server.close()
    await rm(dir, { recursive: true, force: true })
  }
})
