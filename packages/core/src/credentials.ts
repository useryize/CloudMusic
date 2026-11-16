import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createPrivateKey } from 'node:crypto'
import type { Credentials } from './types.js'
export class CredentialValidationError extends Error {}

export function normalizePrivateKey(input: string): string {
  const text = input.trim().replace(/\\r\\n|\\n|\\r/g, '\n')
  const candidates = text.includes('-----BEGIN')
    ? [text]
    : /^[A-Za-z0-9+/=\s]+$/.test(text)
      ? ['PRIVATE KEY', 'RSA PRIVATE KEY'].map(
          (type) =>
            `-----BEGIN ${type}-----\n${text
              .replace(/\s/g, '')
              .match(/.{1,64}/g)
              ?.join('\n')}\n-----END ${type}-----`,
        )
      : []
  for (const candidate of candidates) {
    try {
      const key = createPrivateKey(candidate)
      if (key.asymmetricKeyType !== 'rsa') continue
      return key.export({ type: 'pkcs8', format: 'pem' }).toString()
    } catch {
      /* 尝试下一种私钥容器；不记录密钥内容。 */
    }
  }
  throw new CredentialValidationError(
    '无法解析 RSA 私钥：请复制 PrivateKey，支持完整 PEM 或 Base64 正文，请勿填写 PubKey 或 AppSecret。',
  )
}
export async function loadCredentials(
  dir: string,
): Promise<Partial<Credentials>> {
  let local: Partial<Credentials> = {}
  try {
    local = JSON.parse(
      await readFile(join(dir, 'credentials.json'), 'utf8'),
    ) as Partial<Credentials>
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  return {
    appId: process.env.CM_APP_ID || local.appId,
    privateKey:
      process.env.CM_PRIVATE_KEY || local.privateKey
        ? normalizePrivateKey(
            process.env.CM_PRIVATE_KEY || local.privateKey || '',
          )
        : undefined,
  }
}
export async function saveCredentials(dir: string, credentials: Credentials) {
  const appId = credentials.appId.trim()
  if (!appId) throw new CredentialValidationError('请填写应用 AppID。')
  const privateKey = normalizePrivateKey(credentials.privateKey)
  await mkdir(dir, { recursive: true, mode: 0o700 })
  await writeFile(
    join(dir, 'credentials.json'),
    JSON.stringify({ appId, privateKey }),
    {
      mode: 0o600,
    },
  )
}
