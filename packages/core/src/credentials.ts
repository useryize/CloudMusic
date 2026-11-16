import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createPrivateKey } from 'node:crypto'
import type { Credentials } from './types.js'
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
    privateKey: process.env.CM_PRIVATE_KEY || local.privateKey,
  }
}
export async function saveCredentials(dir: string, credentials: Credentials) {
  if (createPrivateKey(credentials.privateKey).asymmetricKeyType !== 'rsa')
    throw new Error('需要 RSA 私钥')
  await mkdir(dir, { recursive: true, mode: 0o700 })
  await writeFile(join(dir, 'credentials.json'), JSON.stringify(credentials), {
    mode: 0o600,
  })
}
