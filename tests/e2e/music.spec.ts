import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
const id = 'SONG-ENCRYPTED'
const song = {
  id,
  originalId: 123456,
  name: '夜航测试曲',
  duration: 6000,
  coverImgUrl: '',
  artists: [{ id: 'ART', name: '测试艺人' }],
  album: { id: 'ALB', name: '夜行记' },
  playFlag: true,
}
const playlist = {
  id: 'PLAYLIST-ENCRYPTED',
  name: '深夜飞行',
  trackCount: 1,
  playCount: 100,
  creatorNickName: '测试用户',
}
const wav = Buffer.alloc(44 + 44100 * 2 * 6)
wav.write('RIFF')
wav.writeUInt32LE(wav.length - 8, 4)
wav.write('WAVEfmt ', 8)
wav.writeUInt32LE(16, 16)
wav.writeUInt16LE(1, 20)
wav.writeUInt16LE(1, 22)
wav.writeUInt32LE(44100, 24)
wav.writeUInt32LE(88200, 28)
wav.writeUInt16LE(2, 32)
wav.writeUInt16LE(16, 34)
wav.write('data', 36)
wav.writeUInt32LE(wav.length - 44, 40)
async function mock(page: Page, loggedIn = false, cli = false) {
  const writes: Record<string, unknown>[] = []
  let nativeStatus = 'stopped',
    nativePosition = 0
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    if (!url.pathname.startsWith('/api/')) {
      await route.continue()
      return
    }
    const body = route.request().postDataJSON() as {
      path?: string
      biz?: Record<string, unknown>
      action?: string
      value?: number
    } | null
    let data: unknown = {}
    let code = 200
    if (url.pathname === '/api/connection')
      data = { backend: cli ? 'cli' : 'direct', supports: {} }
    else if (url.pathname === '/api/player/action') {
      writes.push({ player: body })
      if (body?.action === 'play' || body?.action === 'resume')
        nativeStatus = 'playing'
      if (body?.action === 'pause') nativeStatus = 'paused'
      if (body?.action === 'seek') nativePosition = body.value ?? 0
      data = { ok: true }
    } else if (url.pathname === '/api/player/state')
      data = { status: nativeStatus, position: nativePosition }
    else if (url.pathname === '/api/auth/status')
      data = { loggedIn, anonymous: false }
    else if (url.pathname === '/api/auth/qrcode')
      data = {
        key: 'key',
        qrUrl: 'https://music.163.com/login?key=test',
        expiresIn: 300,
      }
    else if (url.pathname === '/api/auth/poll') {
      loggedIn = true
      data = { status: 803, msg: '登录成功' }
    } else if (url.pathname === '/api/playback/resolve')
      data = { src: '/api/audio/test', bitrate: 320 }
    else if (url.pathname === '/api/audio/test') {
      await route.fulfill({ status: 200, contentType: 'audio/wav', body: wav })
      return
    } else if (url.pathname === '/api/rpc') {
      const path = body?.path || ''
      if (path.includes('/recommend/playlist/')) data = { records: [playlist] }
      else if (path.includes('/daily/image'))
        data = { name: '听见今天', imgUrl: '' }
      else if (path.includes('/new/song/')) data = [song]
      else if (path.includes('/playlist/detail/')) {
        expect(body?.biz?.playlistId).toBe(playlist.id)
        data = playlist
      } else if (path.includes('/playlist/song/list/'))
        data = { tracks: [song], trackCount: 1 }
      else if (path.includes('/search/song/'))
        data = { records: [song], recordCount: 1 }
      else if (path.includes('/search/album/')) {
        code = 403
        data = null
      } else if (path.includes('/search/'))
        data = { records: [], recordCount: 0 }
      else if (path.includes('/song/lyric/'))
        data = { lyric: '[00:00]第一句歌词\n[00:02]第二句歌词' }
      else if (path.includes('/get-best-comments-by-song'))
        data = {
          comments: [
            { content: '很喜欢这首歌', nickName: '听众', likedCount: 10 },
          ],
        }
      else if (path.includes('/comments/get/'))
        data = { recordCount: 1, records: [] }
      else if (path.includes('/resource/comments/')) {
        writes.push(body?.biz ?? {})
        data = { commentId: 'comment', content: body?.biz?.content }
      } else if (path.includes('/user/profile/'))
        data = { id: 'user', nickname: '测试用户' }
      else if (path.includes('/song/play/record/')) data = [song]
      await route.fulfill({
        json: { code, data, message: code === 403 ? '无接口权限' : null },
      })
      return
    }
    await route.fulfill({ json: data })
  })
  return writes
}
test('扫码登录 → 首页 → 歌单 → 播放与歌词', async ({ page }) => {
  await mock(page)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/login')
  await page.getByRole('button', { name: '生成登录二维码' }).click()
  await expect(page).toHaveURL(/127\.0\.0\.1:5174\/$/)
  await expect(page.getByRole('link', { name: '深夜飞行' })).toBeVisible()
  await page.screenshot({ path: 'test-results/m1-discover.png' })
  await page.getByRole('link', { name: '深夜飞行' }).click()
  await expect(page.getByRole('heading', { name: '深夜飞行' })).toBeVisible()
  await page.getByRole('button', { name: '播放全部' }).click()
  await expect(
    page.getByRole('button', { name: '暂停', exact: true }),
  ).toBeVisible()
  await page.getByRole('slider', { name: '播放进度' }).fill('2')
  await expect
    .poll(async () =>
      Number(await page.getByRole('slider', { name: '播放进度' }).inputValue()),
    )
    .toBeGreaterThan(1.5)
  await page.getByRole('link', { name: '打开播放页' }).click()
  await expect(page.getByRole('heading', { name: '夜航测试曲' })).toBeVisible()
  await expect(page.getByRole('button', { name: '第二句歌词' })).toBeVisible()
  await page.screenshot({ path: 'test-results/m2-now-playing.png' })
  expect(errors).toEqual([])
})
test('CLI 播放控制使用本地播放器，不请求浏览器音频直链', async ({ page }) => {
  const writes = await mock(page, true, true)
  const requests: string[] = []
  page.on('request', (request) =>
    requests.push(new URL(request.url()).pathname),
  )
  await page.goto('/playlist/PLAYLIST-ENCRYPTED')
  await page.getByRole('button', { name: '播放全部' }).click()
  await expect(
    page.getByRole('button', { name: '暂停', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: '暂停', exact: true }).click()
  await expect(
    page.getByRole('button', { name: '播放', exact: true }),
  ).toBeVisible()
  await page.getByRole('slider', { name: '播放进度' }).fill('2')
  await expect
    .poll(async () =>
      Number(await page.getByRole('slider', { name: '播放进度' }).inputValue()),
    )
    .toBe(2)
  expect(
    writes.some(
      (item) => (item.player as { action: string })?.action === 'play',
    ),
  ).toBe(true)
  expect(
    writes.some(
      (item) => (item.player as { action: string })?.action === 'seek',
    ),
  ).toBe(true)
  expect(requests).not.toContain('/api/playback/resolve')
  await expect(page.getByLabel('音质', { exact: true })).toHaveCount(0)
})
test('搜索综合分类失败不影响单曲结果', async ({ page }) => {
  await mock(page)
  await page.goto('/')
  await page.getByRole('textbox', { name: '搜索音乐' }).fill('夜航')
  await page.getByRole('textbox', { name: '搜索音乐' }).press('Enter')
  await expect(
    page.getByText('此分类暂时加载失败，可进入分类重试。'),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '夜航测试曲', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: '单曲', exact: true }).click()
  await expect(page).toHaveURL(/type=song/)
  await page.screenshot({ path: 'test-results/m3-search.png' })
})
test('评论需显式点击发送，成功后清空草稿', async ({ page }) => {
  const writes = await mock(page, true)
  await page.goto('/comment/12345')
  await expect(page.getByText('很喜欢这首歌')).toBeVisible()
  await page
    .getByRole('textbox', { name: '说点什么…' })
    .fill('本地自动化测试评论')
  expect(writes).toHaveLength(0)
  await page.getByRole('button', { name: '发送', exact: true }).click()
  await expect(page.getByRole('textbox', { name: '说点什么…' })).toHaveValue('')
  expect(writes).toEqual([
    {
      resourceId: '12345',
      resourceType: 4,
      threadId: 'R_SO_4_12345',
      content: '本地自动化测试评论',
      forwardEvent: 0,
    },
  ])
  await page.screenshot({ path: 'test-results/m3-comments.png' })
})
