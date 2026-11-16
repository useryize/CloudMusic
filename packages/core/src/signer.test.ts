import { describe, it, expect } from 'vitest'
import { generateKeyPairSync, verify } from 'node:crypto'
import { sign, signingContent } from './signer'
import { allowedPath } from './client'
describe('RSA 请求签名', () => {
  it('按 ASCII 排序，剔除空值和 sign，保留 0', () => {
    expect(
      signingContent({ z: '', a: 0, c: null, b: '中文', sign: 'old' }),
    ).toBe('a=0&b=中文')
  })
  it('生成可验证的 SHA256 RSA 签名', () => {
    const keys = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const params = { timestamp: '123', appId: 'demo' }
    const key = keys.privateKey
      .export({ type: 'pkcs8', format: 'pem' })
      .toString()
    expect(
      verify(
        'RSA-SHA256',
        Buffer.from('appId=demo&timestamp=123'),
        keys.publicKey,
        Buffer.from(sign(params, key), 'base64'),
      ),
    ).toBe(true)
  })
  it('禁止绝对地址、路径穿越和查询串', () => {
    for (const path of [
      '/etc/passwd',
      '//evil.com',
      '/openapi/music/../admin',
      '/openapi/music/a?x=y',
    ])
      expect(allowedPath(path)).toBe(false)
    expect(allowedPath('/openapi/music/basic/search/hot/keyword/get/v2')).toBe(
      true,
    )
  })
})
