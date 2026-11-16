import { randomBytes } from 'node:crypto'
import type { Biz, Credentials, Envelope } from '@cloudmusic/core'
import { PlatformError } from '@cloudmusic/core'
import { createCliRunner } from './cli.js'
import type { CliResult } from './cli.js'
import type { Gateway } from './gateway.js'
import { stripSecrets } from './features.js'
const prefix = '/openapi/music/basic/'
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
function value(biz: Biz, name: string) {
  const v = biz[name]
  if (
    (typeof v !== 'string' && typeof v !== 'number') ||
    !String(v).trim() ||
    String(v).length > 1000
  )
    throw new PlatformError(400, `缺少有效参数 ${name}`)
  return String(v).trim()
}
function number(biz: Biz, name: string, fallback: number, max = 500) {
  const n = Number(biz[name] ?? fallback)
  if (!Number.isInteger(n) || n < 0 || n > max)
    throw new PlatformError(400, `${name} 超出范围`)
  return String(n)
}
const flag = (name: string, val: string) => `--${name}=${val}`
export function cliCommand(
  path: string,
  biz: Biz,
): { args: string[]; write?: boolean; slice?: boolean; extract?: string } {
  const paging = () => [
    flag('limit', number(biz, 'limit', 30)),
    flag('offset', number(biz, 'offset', 0, 1000000)),
  ]
  const id = (name: string) => flag(name, value(biz, name))
  const search: Record<string, string> = {
    'search/song/get/v3': 'song',
    'search/playlist/get/v2': 'playlist',
    'search/album/get/v2': 'album',
    'search/mv/get/v1': 'mv',
  }
  const suffix = path.startsWith(prefix) ? path.slice(prefix.length) : ''
  if (search[suffix])
    return {
      args: [
        'search',
        search[suffix],
        flag('keyword', value(biz, 'keyword')),
        ...paging(),
      ],
    }
  if (suffix === 'search/artists/get/v2')
    return {
      args: ['search', 'all', flag('keyword', value(biz, 'keyword'))],
      extract: 'artists',
      slice: true,
    }
  if (suffix === 'complex/search')
    return { args: ['search', 'all', flag('keyword', value(biz, 'keyword'))] }
  if (path === '/openapi/search/multi/terminal/voicelist')
    return {
      args: [
        'search',
        'podcast',
        flag('keyword', value(biz, 'keyword')),
        ...paging(),
      ],
    }
  if (suffix === 'recommend/songlist/get/v2')
    return {
      args: ['recommend', 'daily', flag('limit', number(biz, 'limit', 30, 40))],
    }
  if (suffix === 'recommend/playlist/get')
    return { args: ['playlist', 'radar'], slice: true }
  if (suffix === 'playlist/detail/get/v2')
    return { args: ['playlist', 'get', id('playlistId')] }
  if (suffix === 'playlist/song/list/get/v5')
    return { args: ['playlist', 'tracks', id('playlistId'), ...paging()] }
  if (suffix === 'album/detail/get/v2')
    return { args: ['album', 'get', id('albumId'), '--descFlag=true'] }
  if (suffix === 'album/song/list/get/v3')
    return { args: ['album', 'tracks', id('albumId')], slice: true }
  if (suffix === 'artists/song/list/get')
    return {
      args: [
        'artist',
        'songs',
        id('artistId'),
        ...paging(),
        '--startTime=0',
        flag('endTime', String(Date.now())),
      ],
    }
  if (suffix === 'user/profile/get/v2') return { args: ['user', 'info'] }
  if (suffix === 'playlist/star/get/v2') return { args: ['user', 'favorite'] }
  if (suffix === 'playlist/subed/get/v2')
    return { args: ['playlist', 'collected', ...paging()] }
  if (suffix === 'song/play/record/list')
    return {
      args: ['user', 'history', flag('limit', number(biz, 'limit', 100))],
    }
  if (suffix === 'song/lyric/get/v2')
    return { args: ['song', 'lyric', id('songId')] }
  if (suffix === 'playlist/song/like/v2') {
    if (typeof biz.isLike !== 'boolean')
      throw new PlatformError(400, 'isLike 必须是布尔值')
    return {
      args: ['song', biz.isLike ? 'like' : 'dislike', id('songId')],
      write: true,
    }
  }
  if (
    suffix === 'comments/get/v2' ||
    path === '/openapi/music/comment/get-best-comments-by-song'
  )
    return {
      args: [
        'comment',
        'list-hot',
        flag('type', String(biz.type || 'song')),
        flag(
          'resourceId',
          value(biz, biz.resourceId ? 'resourceId' : 'songId'),
        ),
        ...paging(),
      ],
    }
  if (
    path === '/openapi/v1/resource/comments/add' ||
    path === '/openapi/v1/resource/comments/reply'
  ) {
    const resourceId = value(biz, 'resourceId')
    if (!/^\d+$/.test(resourceId))
      throw new PlatformError(400, '发表评论需要原始数字歌曲 ID')
    return {
      args: [
        'comment',
        path.endsWith('/reply') ? 'reply' : 'post',
        '--resourceType=4',
        flag('resourceId', resourceId),
        flag('content', value(biz, 'content')),
        ...(path.endsWith('/reply') ? [id('commentId')] : []),
      ],
      write: true,
    }
  }
  throw new PlatformError(501, '当前官方 CLI 未提供此项能力，暂不可用')
}
export function createCliGateway(
  run: ReturnType<typeof createCliRunner> = createCliRunner(),
): Gateway & { configure: (credentials: Credentials) => Promise<void> } {
  const cache = new Map<string, { at: number; value: Envelope }>()
  const pending = new Map<string, Promise<Envelope>>()
  const artists = new Map<string, Record<string, unknown>>()
  const qr = new Map<string, number>()
  let statusCache: { at: number; loggedIn: boolean } | undefined
  let revision = 0
  let statusTask: Promise<{ loggedIn: boolean; anonymous: boolean }> | undefined
  let playerQueue: Promise<unknown> = Promise.resolve()
  let ownedPlayback = false
  const player: NonNullable<Gateway['player']> = {
    async action(command) {
      const task = playerQueue
        .catch(() => {})
        .then(async () => {
          let args: string[]
          if (command.action === 'play') {
            if (
              !/^[0-9a-f]{32}$/i.test(command.songId || '') ||
              !/^\d+$/.test(command.originalId || '')
            )
              throw new PlatformError(
                400,
                '播放需要有效的歌曲加密 ID 和原始 ID，请从搜索或推荐列表选择歌曲',
              )
            args = [
              'play',
              '--song',
              flag('encrypted-id', command.songId!),
              flag('original-id', command.originalId!),
            ]
          } else if (command.action === 'volume') {
            if (
              !Number.isFinite(command.value) ||
              command.value! < 0 ||
              command.value! > 100
            )
              throw new PlatformError(400, '音量超出范围')
            args = ['volume', String(Math.round(command.value!))]
          } else if (command.action === 'seek') {
            if (
              !Number.isFinite(command.value) ||
              command.value! < 0 ||
              command.value! > 86400
            )
              throw new PlatformError(400, '进度超出范围')
            args = ['seek', String(command.value)]
          } else args = [command.action]
          try {
            await run(args)
          } catch (error) {
            if (command.action === 'play')
              throw new PlatformError(
                502,
                '官方播放器启动失败。请确认本机已安装 mpv，或先在终端使用官方 CLI 验证播放。',
              )
            throw error
          }
          if (command.action === 'play') ownedPlayback = true
          if (command.action === 'stop') ownedPlayback = false
          return { ok: true }
        })
      playerQueue = task
      return task
    },
    async status() {
      const result = await run(['state'])
      const state = record(result.state)
      return {
        status: String(state.status || 'stopped'),
        position: Number.isFinite(Number(state.position))
          ? Number(state.position)
          : 0,
      }
    },
  }
  function remember(raw: unknown) {
    const data = record(raw)
    const rows = Array.isArray(raw)
      ? raw
      : Array.isArray(data.records)
        ? data.records
        : []
    for (const rawItem of rows) {
      const item = record(rawItem)
      for (const artist of Array.isArray(item.artists) ? item.artists : []) {
        const a = record(artist)
        if (a.id && a.name)
          artists.set(String(a.id), {
            id: a.id,
            name: a.name,
            coverImgUrl: a.coverImgUrl,
          })
      }
    }
    while (artists.size > 500) artists.delete(artists.keys().next().value!)
  }
  async function status() {
    if (statusCache && Date.now() - statusCache.at < 1500)
      return { loggedIn: statusCache.loggedIn, anonymous: false }
    statusTask ??= (async () => {
      const expected = revision
      const result = await run(['login', '--check'], { allowFailure: true })
      if (expected !== revision) return { loggedIn: false, anonymous: false }
      statusCache = { at: Date.now(), loggedIn: result.success === true }
      return { loggedIn: statusCache.loggedIn, anonymous: false }
    })().finally(() => {
      statusTask = undefined
    })
    return statusTask
  }
  async function request(path: string, biz: Biz = {}): Promise<Envelope> {
    const expected = revision
    if (path === prefix + 'artist/detail/get/v2') {
      const artist = artists.get(value(biz, 'artistId'))
      if (!artist)
        throw new PlatformError(
          501,
          '当前 CLI 未提供艺人详情，请从搜索结果进入艺人页面',
        )
      return { code: 200, data: artist }
    }
    const command = cliCommand(path, biz)
    const key = JSON.stringify([expected, path, biz])
    if (!command.write) {
      const cached = cache.get(key)
      if (cached && Date.now() - cached.at < 60000) return cached.value
      const task = pending.get(key)
      if (task) return task
    }
    const task = (async () => {
      if (!(await status()).loggedIn)
        throw new PlatformError(401, '请先通过官方 CLI 扫码登录')
      const result: CliResult = await run(command.args)
      if (expected !== revision)
        throw new PlatformError(401, '登录状态已改变，请重新加载')
      const envelope: Envelope =
        typeof result.code === 'number'
          ? {
              code: result.code,
              message: result.message,
              data: result.data ?? result.comment,
              subCode: result.subCode as string | number | null | undefined,
            }
          : { code: 200, data: result.data ?? result }
      let data = stripSecrets(envelope.data)
      if (command.extract) data = record(data)[command.extract]
      if (command.slice) {
        const v = record(data)
        const all = Array.isArray(data)
          ? data
          : Array.isArray(v.records)
            ? v.records
            : []
        const offset = Number(number(biz, 'offset', 0, 1000000))
        const limit = Number(number(biz, 'limit', 30))
        data = {
          records: all.slice(offset, offset + limit),
          recordCount: all.length,
          more: offset + limit < all.length,
        }
      }
      envelope.data = data
      remember(data)
      if (command.write) cache.clear()
      else {
        cache.set(key, { at: Date.now(), value: envelope })
        if (cache.size > 200) cache.delete(cache.keys().next().value!)
      }
      return envelope
    })().finally(() => pending.delete(key))
    if (!command.write) pending.set(key, task)
    return task
  }
  return {
    player,
    request,
    status,
    async qrcode() {
      const result = await run(['login', '--background'])
      const url = String(result.qrCodeUrl || result.clickableUrl || '')
      if (!/^https:\/\//.test(url))
        throw new PlatformError(502, '官方 CLI 未返回有效登录链接')
      const key = randomBytes(16).toString('hex')
      qr.clear()
      qr.set(key, Date.now() + 300000)
      statusCache = undefined
      return { key, qrUrl: url, expiresIn: 300 }
    },
    async poll(key) {
      if ((qr.get(key) ?? 0) < Date.now())
        return { status: 800, msg: '登录链接已过期，请刷新' }
      const loggedIn = (await status()).loggedIn
      return {
        status: loggedIn ? 803 : 801,
        msg: loggedIn ? '已登录实名账号' : '等待手机授权',
      }
    },
    async anonymous() {
      throw new PlatformError(401, '官方 CLI 需要扫码登录，不支持匿名体验')
    },
    async logout() {
      revision++
      cache.clear()
      artists.clear()
      pending.clear()
      statusCache = undefined
      if (ownedPlayback) await player.action({ action: 'stop' })
      await run(['logout'])
      cache.clear()
      artists.clear()
      qr.clear()
      statusCache = undefined
      return { ok: true }
    },
    async configure(credentials) {
      revision++
      cache.clear()
      artists.clear()
      pending.clear()
      statusCache = undefined
      await run(['config', 'set', 'appId', credentials.appId], {
        statusOnly: true,
      })
      await run(
        [
          'config',
          'set',
          'privateKey',
          credentials.privateKey
            .replace(/-----BEGIN [^-]+-----|-----END [^-]+-----/g, '')
            .replace(/\s/g, ''),
        ],
        { statusOnly: true },
      )
      cache.clear()
      statusCache = undefined
    },
  }
}
