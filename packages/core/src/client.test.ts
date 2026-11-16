import { it, expect, vi } from 'vitest'
import { generateKeyPairSync } from 'node:crypto'
import { createClient } from './client'
import { DeviceParameterError } from './errors'
const key = generateKeyPairSync('rsa', { modulusLength: 2048 })
  .privateKey.export({ type: 'pkcs8', format: 'pem' })
  .toString()
it('设备参数错误包含实际失败接口及缺失字段，不包含密钥或 Token', async () => {
  const transport = vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 400,
          message: '公共参数校验失败，请检查os/channel/brand等是否符合约定',
        }),
      ),
    )
  const client = createClient(
    async () => ({ appId: 'app', privateKey: key }),
    async () => ({
      device: { appVer: '1.0.0' },
      deviceId: 'device',
      token: 'secret-token',
    }),
    transport,
  )
  const error = await client
    .call('/openapi/music/basic/oauth2/login/anonymous')
    .catch((error: unknown) => error)
  expect(error).toBeInstanceOf(DeviceParameterError)
  const diagnostic = error as DeviceParameterError
  expect(diagnostic.details.path).toBe(
    '/openapi/music/basic/oauth2/login/anonymous',
  )
  expect(diagnostic.details.missingFields).toContain('channel')
  expect(diagnostic.details.missingFields).not.toContain('deviceId')
  expect(JSON.stringify(error)).not.toContain(key)
  expect(JSON.stringify(error)).not.toContain('secret-token')
})
it('不把普通业务参数错误误判为设备权限错误', async () => {
  const transport = vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      new Response(
        JSON.stringify({ code: 400, message: 'playlistId不能为空' }),
      ),
    )
  const client = createClient(
    async () => ({ appId: 'app', privateKey: key }),
    async () => ({}),
    transport,
  )
  expect(
    await client.call('/openapi/music/basic/playlist/detail/get/v2'),
  ).toEqual({ code: 400, message: 'playlistId不能为空' })
})
