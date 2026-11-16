import { it, expect } from 'vitest'
import { nextIndex } from './store'
import { lyricIndex, parseLyrics } from './lyrics'
import { track, list } from '../api/types'
it('队列边界、顺序和随机播放不会重复当前首', () => {
  expect(nextIndex(2, 3, 'off', false)).toBe(-1)
  expect(nextIndex(2, 3, 'all', false)).toBe(0)
  expect(nextIndex(0, 3, 'all', false, -1)).toBe(2)
  expect(nextIndex(0, 0, 'all', true)).toBe(-1)
  for (const r of [0, 0.25, 0.999])
    expect(nextIndex(1, 3, 'all', true, 1, () => r)).not.toBe(1)
})
it('解析多时间标签、毫秒和偏移量，歌词二分定位', () => {
  const lines = parseLyrics(
    '[offset:100]\n[00:01.20][00:02.300]同一句\n[00:03]下一句',
  )
  expect(lines.map((l) => l.time)).toEqual([1.3, 2.4, 3.1])
  expect(lyricIndex(lines, 0)).toBe(-1)
  expect(lyricIndex(lines, 2.5)).toBe(1)
  expect(lyricIndex([], 10)).toBe(-1)
})
it('数据适配保留加密 ID、毫秒转秒且不保存播放直链', () => {
  const result = track({
    id: 'ABCDEF',
    name: '歌',
    duration: 120000,
    playUrl: 'secret-url',
    artists: [{ id: 'ART', name: '人' }],
    album: { id: 'ALB', name: '专辑' },
  })
  expect(result.id).toBe('ABCDEF')
  expect(result.duration).toBe(120)
  expect(result).not.toHaveProperty('playUrl')
  expect(
    list({ page: { recordCount: 1, more: false }, records: [result] }, (v) => v)
      .total,
  ).toBe(1)
})
