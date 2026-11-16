import { beforeAll, afterAll, afterEach, it, expect, vi } from 'vitest'
import type { Track } from '../api/types'
import type { ResolvedAudio } from './urlResolver'
type Engine = typeof import('./engine')
let Player: Engine['PlayerController']
let store: (typeof import('./store'))['usePlayerPreferences']
class FakeAudio extends EventTarget {
  src = ''
  paused = true
  currentTime = 0
  duration = 100
  readyState = 4
  seeking = false
  volume = 1
  preload = 'none'
  async play() {
    this.paused = false
    this.dispatchEvent(new Event('playing'))
  }
  pause() {
    if (!this.paused) {
      this.paused = true
      this.dispatchEvent(new Event('pause'))
    }
  }
  removeAttribute() {
    this.src = ''
  }
  load() {}
}
const song = (id: string): Track => ({
  id,
  name: id,
  duration: 100,
  artists: [],
  album: { id: 'a', name: 'a' },
  playable: true,
})
beforeAll(async () => {
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  })
  vi.stubGlobal('requestAnimationFrame', () => 1)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify({ code: 200, data: null }), {
          headers: { 'content-type': 'application/json' },
        }),
    ),
  )
  Player = (await import('./engine')).PlayerController
  store = (await import('./store')).usePlayerPreferences
})
afterEach(() => {
  store.setState({
    queue: [],
    index: -1,
    status: 'idle',
    repeat: 'all',
    shuffle: false,
  })
})
afterAll(() => vi.unstubAllGlobals())
it('快速切歌时丢弃旧解析结果，不会覆盖新歌曲音源', async () => {
  let first!: (value: ResolvedAudio) => void
  const resolve = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<ResolvedAudio>((r) => {
          first = r
        }),
    )
    .mockResolvedValue({ src: '/api/audio/new' })
  const audio = new FakeAudio()
  const player = new Player(resolve, () => audio as unknown as HTMLAudioElement)
  const old = player.playQueue([song('old')])
  await player.playQueue([song('new')])
  first({ src: '/api/audio/old' })
  await old
  expect(audio.src).toBe('/api/audio/new')
  expect(store.getState().queue[store.getState().index].id).toBe('new')
  player.stop()
})
it('媒体错误重新解析地址并恢复进度，最多重取两次', async () => {
  const resolve = vi.fn(async () => ({ src: '/api/audio/fresh' }))
  const audio = new FakeAudio()
  const player = new Player(resolve, () => audio as unknown as HTMLAudioElement)
  await player.playQueue([song('one')])
  audio.currentTime = 42
  audio.dispatchEvent(new Event('error'))
  await vi.waitFor(() => expect(resolve).toHaveBeenCalledTimes(2))
  await vi.waitFor(() => expect(store.getState().status).toBe('playing'))
  expect(audio.currentTime).toBe(42)
  audio.dispatchEvent(new Event('error'))
  await vi.waitFor(() => expect(resolve).toHaveBeenCalledTimes(3))
  await vi.waitFor(() => expect(store.getState().status).toBe('playing'))
  audio.dispatchEvent(new Event('error'))
  expect(store.getState().status).toBe('error')
  expect(resolve).toHaveBeenCalledTimes(3)
  player.stop()
})
it('连续三首解析失败后停止自动跳曲', async () => {
  const resolve = vi.fn(async () => {
    throw new Error('no rights')
  })
  const player = new Player(
    resolve,
    () => new FakeAudio() as unknown as HTMLAudioElement,
  )
  await player.playQueue([song('1'), song('2'), song('3'), song('4')])
  expect(resolve).toHaveBeenCalledTimes(3)
  expect(store.getState().status).toBe('error')
  player.stop()
})
