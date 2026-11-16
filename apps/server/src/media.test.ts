import { it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import { allowedCdn, publicAddress, createMediaRoutes } from './media'
import { stripSecrets } from './features'
it('音频白名单拒绝内网、伪造后缀、用户信息和不安全协议', () => {
  expect(allowedCdn('https://iot202.music.126.net/song.mp3')).toBe(true)
  for (const url of [
    'http://iot202.music.126.net/a',
    'https://127.0.0.1/a',
    'https://music.126.net.evil.com/a',
    'https://evil.com@music.126.net/a',
    'https://music.126.net:8443/a',
  ])
    expect(allowedCdn(url)).toBe(false)
  for (const address of [
    '127.0.0.1',
    '10.1.1.1',
    '192.168.1.1',
    '172.16.0.1',
    '169.254.169.254',
    '::1',
    '::ffff:127.0.0.1',
    'fc00::1',
  ])
    expect(publicAddress(address)).toBe(false)
})
it('业务响应递归剔除凭证与列表携带的播放直链', () => {
  expect(
    stripSecrets({
      data: {
        accessToken: 'hidden',
        nested: [{ refreshToken: 'hidden', name: 'safe', playUrl: 'hidden' }],
      },
      code: 200,
    }),
  ).toEqual({ data: { nested: [{ name: 'safe' }] }, code: 200 })
})
it('本地音频票据透传 Range 与 206，跳转目标重新检查白名单', async () => {
  const app = Fastify()
  const transport = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 206,
        headers: {
          'content-type': 'audio/mpeg',
          'content-range': 'bytes 10-12/100',
          'accept-ranges': 'bytes',
        },
      }),
    )
    .mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: 'http://127.0.0.1/admin' },
      }),
    )
  const routes = createMediaRoutes(app, {
    resolve: async () => [{ address: '8.8.8.8', family: 4 }],
    transport,
  })
  try {
    const first = routes.issue('https://iot202.music.126.net/song.mp3')
    const response = await app.inject({
      url: first,
      headers: { range: 'bytes=10-12' },
    })
    expect(response.statusCode).toBe(206)
    expect(response.headers['content-range']).toBe('bytes 10-12/100')
    expect(transport.mock.calls[0][1]?.headers).toEqual({
      Range: 'bytes=10-12',
    })
    const redirected = await app.inject(
      routes.issue('https://iot202.music.126.net/redirect'),
    )
    expect(redirected.statusCode).toBe(403)
    expect(transport).toHaveBeenCalledTimes(2)
  } finally {
    await app.close()
  }
})
