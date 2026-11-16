import { it, expect, vi } from 'vitest'
import { cliCommand, createCliGateway } from './cliGateway'
import type { createCliRunner } from './cli'
it('只映射白名单能力，关键词作为单独的选项值，不接受任意命令', () => {
  expect(
    cliCommand('/openapi/music/basic/search/song/get/v3', {
      keyword: '--help',
      limit: 2,
      offset: 0,
    }).args,
  ).toEqual(['search', 'song', '--keyword=--help', '--limit=2', '--offset=0'])
  expect(() => cliCommand('/openapi/music/basic/toplist/get/v2', {})).toThrow(
    '未提供',
  )
  expect(() =>
    cliCommand('/openapi/v1/resource/comments/add', {
      resourceId: 'encrypted',
      content: 'test',
    }),
  ).toThrow('原始数字')
})
it('将官方 CLI 返回接成既有 Envelope，分页雷达并剔除直链', async () => {
  const run = vi
    .fn<ReturnType<typeof createCliRunner>>()
    .mockImplementation(async (args) =>
      args[0] === 'login'
        ? { success: true }
        : {
            code: 200,
            data: [
              { id: 'a', name: 'A', playUrl: 'not-cached' },
              { id: 'b', name: 'B' },
            ],
          },
    )
  const gateway = createCliGateway(run)
  const result = await gateway.request(
    '/openapi/music/basic/recommend/playlist/get',
    { offset: 1, limit: 1 },
  )
  expect(result).toEqual({
    code: 200,
    message: undefined,
    subCode: undefined,
    data: { records: [{ id: 'b', name: 'B' }], recordCount: 2, more: false },
  })
  await gateway.request('/openapi/music/basic/recommend/playlist/get', {
    offset: 1,
    limit: 1,
  })
  expect(
    run.mock.calls.filter(([args]) => args[0] === 'playlist'),
  ).toHaveLength(1)
})
it('播放器只接受 ID，不允许 URL，并串行提交控制命令', async () => {
  const calls: string[] = []
  const run = vi
    .fn<ReturnType<typeof createCliRunner>>()
    .mockImplementation(async (args) => {
      calls.push(args[0])
      await new Promise((resolve) => setTimeout(resolve, 5))
      return { success: true }
    })
  const gateway = createCliGateway(run)
  await expect(
    gateway.player!.action({
      action: 'play',
      songId: 'https://evil.com/audio',
      originalId: '1',
    }),
  ).rejects.toThrow('有效的歌曲')
  await Promise.all([
    gateway.player!.action({
      action: 'play',
      songId: 'A'.repeat(32),
      originalId: '1',
    }),
    gateway.player!.action({ action: 'pause' }),
  ])
  expect(calls).toEqual(['play', 'pause'])
})
it('退出登录后丢弃在途的个人数据，防止旧会话结果重新入缓存', async () => {
  let finish!: (result: { code: number; data: unknown }) => void
  const run = vi
    .fn<ReturnType<typeof createCliRunner>>()
    .mockImplementation(async (args) =>
      args[0] === 'login'
        ? { success: true }
        : args[0] === 'user'
          ? new Promise((resolve) => {
              finish = resolve
            })
          : { success: true },
    )
  const gateway = createCliGateway(run)
  const request = gateway.request('/openapi/music/basic/user/profile/get/v2')
  await vi.waitFor(() => expect(finish).toBeTypeOf('function'))
  await gateway.logout()
  finish({ code: 200, data: { nickname: 'old' } })
  await expect(request).rejects.toThrow('登录状态已改变')
})
