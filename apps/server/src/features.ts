import type { FastifyInstance } from 'fastify'
import type { Gateway } from './gateway.js'
import { PlatformError, DeviceParameterError, unwrap } from '@cloudmusic/core'
import { createMediaRoutes } from './media.js'
export async function registerFeatures(app: FastifyInstance, auth: Gateway) {
  const media = createMediaRoutes(app)
  app.get('/api/player/state', async () => {
    if (!auth.player) throw new PlatformError(501, '当前使用浏览器播放器')
    return auth.player.status()
  })
  app.post<{
    Body: {
      action: 'play' | 'pause' | 'resume' | 'stop' | 'seek' | 'volume'
      songId?: string
      originalId?: string
      value?: number
    }
  }>(
    '/api/player/action',
    {
      schema: {
        body: {
          type: 'object',
          required: ['action'],
          additionalProperties: false,
          properties: {
            action: {
              type: 'string',
              enum: ['play', 'pause', 'resume', 'stop', 'seek', 'volume'],
            },
            songId: { type: 'string', maxLength: 128 },
            originalId: { type: 'string', maxLength: 32 },
            value: { type: 'number' },
          },
        },
      },
    },
    async (req) => {
      if (!auth.player) throw new PlatformError(501, '当前使用浏览器播放器')
      return auth.player.action(req.body)
    },
  )
  app.get('/api/auth/status', async () => auth.status())
  app.post('/api/auth/qrcode', async () => auth.qrcode())
  app.get<{ Querystring: { key?: string } }>('/api/auth/poll', async (req) =>
    auth.poll(req.query.key ?? ''),
  )
  app.post('/api/auth/anonymous', async () => auth.anonymous())
  app.post('/api/auth/logout', async () => {
    media.clear()
    return auth.logout()
  })
  app.post<{ Body: { songId: string; bitrate?: number } }>(
    '/api/playback/resolve',
    {
      schema: {
        body: {
          type: 'object',
          required: ['songId'],
          additionalProperties: false,
          properties: {
            songId: { type: 'string', minLength: 1, maxLength: 128 },
            bitrate: { type: 'integer', enum: [128, 192, 320, 999] },
          },
        },
      },
    },
    async (req) => {
      const result = await auth.request(
        '/openapi/music/basic/song/playurl/get/v2',
        { songId: req.body.songId, bitrate: req.body.bitrate ?? 320 },
      )
      const data = unwrap<{
        url?: string
        br?: number
        duration?: number
        freeTrail?: { start: number; end: number }
        playUrlExpireTime?: number
        openApiTraceInfo?: string
      }>(result)
      if (!data?.url)
        throw new PlatformError(
          403,
          String(result.subCode) === '10004'
            ? '请前往网易云音乐购买后收听'
            : '当前歌曲暂无可播放音源',
        )
      return {
        src: media.issue(data.url, data.playUrlExpireTime),
        bitrate: data.br && data.br > 10000 ? data.br / 1000 : data.br,
        duration: data.duration,
        freeTrail: data.freeTrail,
        openApiTraceInfo: data.openApiTraceInfo,
      }
    },
  )
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof PlatformError)
      return reply
        .code(
          error.code === 401 || [1406, 1408].includes(error.code)
            ? 401
            : error.code >= 400 && error.code < 600
              ? error.code
              : 502,
        )
        .send({
          code: error.code,
          msg: error.message,
          ...(error instanceof DeviceParameterError
            ? { details: error.details }
            : {}),
        })
    if (error instanceof Error && error.message === 'SETUP_REQUIRED')
      return reply.code(409).send({ code: 409, msg: '请先配置应用凭证' })
    if (error && typeof error === 'object' && 'validation' in error)
      return reply.code(400).send({ code: 400, msg: '请求参数不正确' })
    return reply
      .code(502)
      .send({ code: 502, msg: '请求失败，请检查网络、应用配置或接口权限' })
  })
}
export function stripSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripSecrets)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) =>
            ![
              'accessToken',
              'refreshToken',
              'privateKey',
              'appSecret',
              'clientSecret',
              'playUrl',
              'playUrlExpireTime',
              'debugInfo',
            ].includes(key),
        )
        .map(([key, v]) => [key, stripSecrets(v)]),
    )
  return value
}
