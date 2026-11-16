import Fastify from 'fastify'
import serveStatic from '@fastify/static'
import { randomBytes } from 'node:crypto'
import { mkdir, writeFile, unlink, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createClient,
  loadCredentials,
  saveCredentials,
  allowedPath,
  CredentialValidationError,
  PlatformError,
  createTokenStore,
  loadDevice,
  saveDevice,
  deviceFields,
  normalizePrivateKey,
} from '@cloudmusic/core'
import type { Biz } from '@cloudmusic/core'
import { cookieToken, safeEqual, trustedRequest } from './guard.js'
import { registerFeatures, stripSecrets } from './features.js'
import { createCliGateway } from './cliGateway.js'

export async function startServer(
  options: {
    port?: number
    dev?: boolean
    dataDir?: string
    webRoot?: string
    backend?: 'cli' | 'direct'
  } = {},
) {
  const app = Fastify({ logger: false, bodyLimit: 32768 })
  const token = randomBytes(32).toString('hex')
  const dir = options.dataDir ?? join(homedir(), '.cloudmusic')
  let defaultDevice: Record<string, string> = { appVer: '1.0.0' }
  const configPath = fileURLToPath(
    new URL('../../../config/default.json', import.meta.url),
  )
  if (existsSync(configPath))
    defaultDevice = (
      JSON.parse(await readFile(configPath, 'utf8')) as {
        device: Record<string, string>
      }
    ).device
  const core = createClient(
    () => loadCredentials(dir),
    async () => ({ device: await loadDevice(dir, defaultDevice) }),
  )
  const backend =
    options.backend ?? (process.env.CM_BACKEND === 'direct' ? 'direct' : 'cli')
  const cli = backend === 'cli' ? createCliGateway() : undefined
  const auth =
    cli ?? (await createTokenStore(dir, () => loadCredentials(dir), core.call))
  app.addHook('onRequest', async (req, reply) => {
    reply
      .header('Cache-Control', 'no-store')
      .header('X-Content-Type-Options', 'nosniff')
      .header('Referrer-Policy', 'no-referrer')
    reply.header(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' https: data:; media-src 'self' https:; connect-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'",
    )
    if (!trustedRequest(req, !!options.dev))
      return reply.code(403).send({ code: 403, msg: '跨站请求已阻止' })
    if (req.url === '/api/health') return
    const parsed = new URL(req.url, 'http://localhost')
    if (
      parsed.pathname === '/' &&
      safeEqual(parsed.searchParams.get('t') ?? '', token)
    ) {
      return reply
        .header(
          'Set-Cookie',
          `cm_token=${token}; HttpOnly; SameSite=Strict; Path=/`,
        )
        .redirect('/')
    }
    if (
      options.dev ||
      safeEqual(
        cookieToken(req.headers.cookie) ||
          String(req.headers['x-app-token'] ?? ''),
        token,
      )
    )
      return
    if (!req.url.startsWith('/api/'))
      return reply
        .code(401)
        .type('text/html')
        .send(
          '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>云音乐 · 本地访问</title><h1>请使用启动链接访问</h1><p>从启动终端复制完整链接，或在下方输入访问令牌。</p><form action="/" method="get"><label>访问令牌 <input name="t" required autocomplete="off"></label><button>进入云音乐</button></form></html>',
        )
    return reply.code(401).send({ code: 401, msg: '请从启动链接访问' })
  })
  app.get('/api/health', async () => ({
    ok: true,
    uptime: process.uptime(),
    version: '0.1.0',
  }))
  app.get('/api/connection', async () => ({
    backend,
    supports: {
      anonymous: backend === 'direct',
      playlistSubscription: backend === 'direct',
      albumSubscription: backend === 'direct',
      artistAlbums: backend === 'direct',
      latestComments: backend === 'direct',
      toplist: backend === 'direct',
      browserPlayback: backend === 'direct',
    },
  }))
  app.get('/api/setup', async () => {
    const c = await loadCredentials(dir)
    return {
      configured: !!(c.appId && c.privateKey),
      hasAppSecret: !!c.appSecret,
    }
  })
  app.get('/api/device', async () => ({
    device: await loadDevice(dir, defaultDevice),
    fields: deviceFields,
  }))
  app.post<{ Body: Record<string, string> }>(
    '/api/device',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          properties: Object.fromEntries(
            deviceFields.map((key) => [
              key,
              { type: 'string', maxLength: 128 },
            ]),
          ),
        },
      },
    },
    async (req) => {
      await saveDevice(dir, req.body)
      return { ok: true }
    },
  )
  app.post<{ Body: { appId: string; privateKey: string; appSecret?: string } }>(
    '/api/setup',
    {
      schema: {
        body: {
          type: 'object',
          required: ['appId', 'privateKey'],
          additionalProperties: false,
          properties: {
            appId: { type: 'string', minLength: 1 },
            privateKey: { type: 'string', minLength: 1 },
            appSecret: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      try {
        const previous = await loadCredentials(dir)
        await saveCredentials(dir, {
          ...req.body,
          appSecret:
            req.body.appSecret?.trim() ||
            (previous.appId === req.body.appId.trim()
              ? previous.appSecret
              : undefined),
        })
        if (cli)
          await cli.configure({
            appId: req.body.appId.trim(),
            privateKey: normalizePrivateKey(req.body.privateKey),
          })
        await auth.logout()
        return { ok: true }
      } catch (error) {
        if (error instanceof PlatformError) throw error
        if (error instanceof CredentialValidationError)
          return reply.code(400).send({ code: 400, msg: error.message })
        return reply.code(500).send({
          code: 500,
          msg: '私钥校验已通过，但凭证文件写入失败。请检查本地数据目录的写入权限，或通过 CM_DATA_DIR 指定可写目录。',
        })
      }
    },
  )
  app.post<{ Body: { path: string; biz?: Biz } }>(
    '/api/rpc',
    {
      schema: {
        body: {
          type: 'object',
          required: ['path'],
          additionalProperties: false,
          properties: {
            path: { type: 'string' },
            biz: { type: 'object', additionalProperties: true },
          },
        },
      },
    },
    async (req, reply) => {
      if (
        !allowedPath(req.body.path) ||
        /\/oauth2\//.test(req.body.path) ||
        /\/playurl\//.test(req.body.path)
      )
        return reply.code(400).send({ code: 400, msg: '接口路径不允许' })
      const c = await loadCredentials(dir)
      if (!c.appId || !c.privateKey)
        return reply.code(409).send({
          code: 409,
          missing: ['appId', 'privateKey'].filter(
            (k) => !c[k as keyof typeof c],
          ),
          msg: '请先配置应用凭证',
        })
      try {
        const method = [
          '/openapi/music/basic/recommend/daily/image',
          '/openapi/music/comment/get-best-comments-by-song',
          '/openapi/music/resource/comment/lv1/list/desc',
        ].includes(req.body.path)
          ? 'GET'
          : 'POST'
        return stripSecrets(
          await auth.request(req.body.path, req.body.biz, method),
        )
      } catch (error) {
        if (error instanceof PlatformError) throw error
        return reply
          .code(502)
          .send({ code: 502, msg: '开放平台请求失败，请检查网络或应用凭证' })
      }
    },
  )
  await registerFeatures(app, auth)
  const root =
    options.webRoot ??
    resolve(fileURLToPath(new URL('../../../web-dist', import.meta.url)))
  if (existsSync(root)) await app.register(serveStatic, { root })
  app.setNotFoundHandler((req, reply) =>
    req.url.startsWith('/api/')
      ? reply.code(404).send({ code: 404, msg: '接口未实现' })
      : existsSync(join(root, 'index.html'))
        ? reply.sendFile('index.html')
        : reply
            .code(503)
            .send({ msg: '请运行 pnpm build 或访问开发端口 5173' }),
  )
  await app.listen({ host: '127.0.0.1', port: options.port ?? 0 })
  const address = app.server.address()
  if (!address || typeof address === 'string')
    throw new Error('无法读取监听端口')
  await mkdir(dir, { recursive: true, mode: 0o700 })
  const runtime = join(dir, `runtime-${address.port}.json`)
  await writeFile(
    runtime,
    JSON.stringify({ port: address.port, token, pid: process.pid }),
    { mode: 0o600 },
  )
  return {
    port: address.port,
    token,
    app,
    close: async () => {
      await app.close()
      await unlink(runtime).catch(() => {})
    },
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const i = process.argv.indexOf('--port')
  const server = await startServer({
    dev: process.argv.includes('--dev'),
    port: i >= 0 ? Number(process.argv[i + 1]) : 0,
    dataDir: process.env.CM_DATA_DIR,
  })
  const url = `http://127.0.0.1:${server.port}/?t=${server.token}`
  console.log(`云音乐已启动：${url}`)
  if (process.argv.includes('--open')) await (await import('open')).default(url)
  for (const signal of ['SIGINT', 'SIGTERM'] as const)
    process.once(signal, () => {
      void server.close().then(() => process.exit(0))
    })
}
