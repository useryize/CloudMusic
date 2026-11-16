import { expect, it } from 'vitest'
import { generateKeyPairSync } from 'node:crypto'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  normalizePrivateKey,
  saveCredentials,
  CredentialValidationError,
} from './credentials'

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
})
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
it('支持 PEM、转义换行以及 PKCS8/PKCS1 的 Base64 正文', () => {
  expect(normalizePrivateKey(`  ${pem}  `)).toBe(pem)
  expect(normalizePrivateKey(pem.replace(/\n/g, '\\n'))).toBe(pem)
  for (const type of ['pkcs8', 'pkcs1'] as const) {
    const raw = privateKey.export({ type, format: 'der' }).toString('base64')
    expect(normalizePrivateKey(raw)).toBe(pem)
  }
})
it('拒绝公钥、非 RSA 私钥和无效文本，错误不含密钥正文', () => {
  const ec = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
    .privateKey.export({ type: 'pkcs8', format: 'pem' })
    .toString()
  for (const value of [
    publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    ec,
    'secret-invalid-value',
  ]) {
    expect(() => normalizePrivateKey(value)).toThrow(CredentialValidationError)
  }
})
it('保存规范化凭证，并将磁盘错误与密钥校验错误分开', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cm-credentials-'))
  try {
    await saveCredentials(dir, { appId: ' demo ', privateKey: pem })
    const saved = JSON.parse(
      await readFile(join(dir, 'credentials.json'), 'utf8'),
    ) as { appId: string; privateKey: string }
    expect(saved).toEqual({ appId: 'demo', privateKey: pem })
    const file = join(dir, 'not-a-directory')
    await writeFile(file, '')
    await expect(
      saveCredentials(file, { appId: 'demo', privateKey: pem }),
    ).rejects.not.toBeInstanceOf(CredentialValidationError)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
