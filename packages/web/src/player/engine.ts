import { usePlayerPreferences as state, nextIndex } from './store'
import type { Quality } from './store'
import { resolveAudio } from './urlResolver'
import type { ResolvedAudio } from './urlResolver'
import type { Track } from '../api/types'
import { request } from '../lib/request'
import { useNotice } from '../lib/ui'

export class PlayerController {
  private audio?: HTMLAudioElement
  private context?: AudioContext
  private gain?: GainNode
  private epoch = 0
  private retries = 0
  private failures = 0
  private frame = 0
  private lastTick = 0
  private stalled?: ReturnType<typeof setTimeout>
  private report?: {
    track: Track
    data: ResolvedAudio
    start: number
    seconds: number
    last: number
    started: boolean
  }
  constructor(
    private resolve = resolveAudio,
    private createAudio = () => new Audio(),
  ) {}
  private media() {
    if (this.audio) return this.audio
    const audio = (this.audio = this.createAudio())
    audio.preload = 'none'
    audio.addEventListener('playing', () => {
      this.clearStall()
      this.failures = 0
      state.setState({ status: 'playing', error: '' })
      if (this.report) {
        this.report.last = performance.now()
        if (!this.report.started) {
          this.report.started = true
          void this.sendReport('startplay')
        }
      }
      cancelAnimationFrame(this.frame)
      this.tick()
    })
    audio.addEventListener('pause', () => {
      this.accumulate()
      this.clearStall()
      cancelAnimationFrame(this.frame)
      if (state.getState().status === 'playing')
        state.setState({ status: 'paused' })
    })
    audio.addEventListener('durationchange', () => {
      if (Number.isFinite(audio.duration))
        state.setState({ duration: audio.duration })
    })
    audio.addEventListener('ended', () => {
      this.finishReport('playend')
      if (state.getState().repeat === 'one')
        void this.load(state.getState().index)
      else void this.next(true)
    })
    audio.addEventListener('error', () => {
      if (state.getState().status !== 'resolving') void this.recover()
    })
    audio.addEventListener('waiting', () => {
      this.accumulate()
      this.clearStall()
      this.stalled = setTimeout(() => {
        if (!audio.paused) void this.recover()
      }, 3000)
    })
    audio.addEventListener('seeking', () => this.accumulate())
    audio.addEventListener('seeked', () => {
      if (this.report) this.report.last = performance.now()
    })
    state.subscribe((value) => {
      if (this.gain && this.context)
        this.gain.gain.setTargetAtTime(
          value.volume,
          this.context.currentTime,
          0.05,
        )
      else audio.volume = value.volume
    })
    audio.volume = state.getState().volume
    return audio
  }
  unlock() {
    const audio = this.media()
    if (!this.context && typeof AudioContext !== 'undefined') {
      this.context = new AudioContext()
      this.gain = this.context.createGain()
      this.context
        .createMediaElementSource(audio)
        .connect(this.gain)
        .connect(this.context.destination)
      audio.volume = 1
      this.gain.gain.value = state.getState().volume
    }
    void this.context?.resume().catch(() => {})
  }
  private clearStall() {
    clearTimeout(this.stalled)
    this.stalled = undefined
  }
  private accumulate() {
    if (this.report) {
      const now = performance.now()
      if (
        this.report.last &&
        this.audio &&
        !this.audio.seeking &&
        this.audio.readyState >= 3
      )
        this.report.seconds += Math.max(0, now - this.report.last) / 1000
      this.report.last = 0
    }
  }
  private tick = () => {
    if (!this.audio || this.audio.paused) return
    const now = performance.now()
    if (now - this.lastTick >= 250) {
      this.accumulate()
      if (this.report) this.report.last = now
      state.setState({ currentTime: this.audio.currentTime })
      this.lastTick = now
    }
    this.frame = requestAnimationFrame(this.tick)
  }
  private async sendReport(action: 'startplay' | 'play', end?: string) {
    const report = this.report
    if (!report) return
    const { track, data } = report
    try {
      await request('/openapi/music/basic/play/data/record', {
        id: track.id,
        action,
        type: 'song',
        bitrate: data.bitrate ?? 320,
        file: 4,
        startLogTime: report.start,
        alg: track.alg || '',
        sourceId: track.sourceId || track.id,
        sourceType: track.sourceType || 'song',
        ...(data.freeTrail
          ? {
              isAudition: 1,
              auditionStart: data.freeTrail.start,
              auditionEnd: data.freeTrail.end,
            }
          : {}),
        ...(data.openApiTraceInfo
          ? { openApiTraceInfo: data.openApiTraceInfo }
          : {}),
        ...(action === 'play'
          ? {
              time: Math.min(
                report.seconds,
                state.getState().duration || report.seconds,
              ),
              end,
            }
          : {}),
      })
    } catch {
      useNotice.getState().show('播放数据上报失败，请检查网络或接口权限')
    }
  }
  private finishReport(end: string) {
    this.accumulate()
    if (this.report?.started && this.report.seconds > 0)
      void this.sendReport('play', end)
    this.report = undefined
  }
  async playQueue(tracks: Track[], index = 0) {
    if (!tracks[index]) return
    this.unlock()
    this.failures = 0
    state.setState({ queue: tracks, index })
    await this.load(index)
  }
  private async load(index: number, seek = 0, recovering = false) {
    const track = state.getState().queue[index]
    if (!track) return
    const epoch = ++this.epoch
    const audio = this.media()
    this.clearStall()
    cancelAnimationFrame(this.frame)
    if (!recovering) {
      this.finishReport('ui')
      this.retries = 0
    }
    state.setState({
      index,
      status: 'resolving',
      currentTime: seek,
      duration: track.duration,
      error: '',
    })
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    try {
      if (!track.playable) throw new Error('当前歌曲暂无版权或不可播放')
      const data = await this.resolve(track.id, state.getState().quality)
      if (epoch !== this.epoch) return
      if (!recovering)
        this.report = {
          track,
          data,
          start: Date.now(),
          seconds: 0,
          last: 0,
          started: false,
        }
      audio.src = data.src
      audio.currentTime = Math.max(seek, data.freeTrail?.start ?? 0)
      await audio.play()
      if (epoch !== this.epoch) return
    } catch (error) {
      if (epoch !== this.epoch) return
      const message = error instanceof Error ? error.message : '播放失败'
      if (error instanceof Error && error.name === 'NotAllowedError') {
        state.setState({ status: 'paused', error: '点击播放继续收听' })
        return
      }
      state.setState({ status: 'error', error: message })
      useNotice.getState().show(message)
      this.finishReport('exception')
      if (++this.failures < 3 && state.getState().queue.length > 1)
        await this.next(false, true)
    }
  }
  private async recover() {
    if (!this.audio || this.retries >= 2) {
      this.finishReport('exception')
      state.setState({ status: 'error', error: '音源重试失败，请点击播放重试' })
      return
    }
    this.retries++
    await this.load(state.getState().index, this.audio.currentTime, true)
  }
  async toggle() {
    this.unlock()
    const s = state.getState()
    if (!this.audio) return
    if (s.status === 'playing') this.audio.pause()
    else if (s.index >= 0) {
      if (s.status === 'paused' && this.audio.src) {
        try {
          await this.audio.play()
        } catch {
          state.setState({ status: 'error', error: '播放失败，请重试' })
        }
      } else await this.load(s.index)
    }
  }
  async next(ended = false, keepFailures = false) {
    const s = state.getState()
    const index = nextIndex(s.index, s.queue.length, s.repeat, s.shuffle)
    if (index < 0) {
      this.epoch++
      this.audio?.pause()
      this.finishReport(ended ? 'playend' : 'ui')
      state.setState({ status: 'ended' })
      return
    }
    if (!keepFailures) this.failures = 0
    await this.load(index)
  }
  async prev() {
    const s = state.getState()
    const index = nextIndex(s.index, s.queue.length, s.repeat, false, -1)
    if (index >= 0) {
      this.unlock()
      await this.load(index)
    }
  }
  seek(seconds: number) {
    if (this.audio && Number.isFinite(seconds)) {
      this.accumulate()
      this.audio.currentTime = Math.max(
        0,
        Math.min(seconds, state.getState().duration),
      )
      state.setState({ currentTime: this.audio.currentTime })
    }
  }
  async setQuality(quality: Quality) {
    state.setState({ quality })
    if (state.getState().index >= 0) {
      this.unlock()
      await this.load(state.getState().index, this.audio?.currentTime ?? 0)
    }
  }
  stop() {
    this.epoch++
    this.finishReport('ui')
    this.audio?.pause()
    this.audio?.removeAttribute('src')
    this.audio?.load()
    cancelAnimationFrame(this.frame)
    this.clearStall()
    state.setState({
      queue: [],
      index: -1,
      status: 'idle',
      currentTime: 0,
      duration: 0,
    })
  }
}
export const player = new PlayerController()
