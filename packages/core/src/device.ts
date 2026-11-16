import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
export const deviceFields = [
  'channel',
  'deviceType',
  'os',
  'brand',
  'model',
  'osVer',
  'appVer',
  'clientIp',
  'netStatus',
] as const
export async function loadDevice(
  dir: string,
  defaults: Record<string, string> = {},
) {
  let local: Record<string, string> = {}
  try {
    local = JSON.parse(
      await readFile(join(dir, 'device.json'), 'utf8'),
    ) as Record<string, string>
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  const env = process.env.CM_DEVICE
    ? (JSON.parse(process.env.CM_DEVICE) as Record<string, string>)
    : {}
  return Object.fromEntries(
    deviceFields
      .map((key) => [key, env[key] || local[key] || defaults[key] || ''])
      .filter(([, value]) => value),
  )
}
export async function saveDevice(dir: string, device: Record<string, string>) {
  await mkdir(dir, { recursive: true, mode: 0o700 })
  await writeFile(
    join(dir, 'device.json'),
    JSON.stringify(
      Object.fromEntries(
        deviceFields.map((key) => [key, device[key]?.trim() || '']),
      ),
    ),
    { mode: 0o600 },
  )
}
