import { it, expect, vi } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadDevice, saveDevice } from './device'
it('设备参数环境变量优先，本地文件次之，忽略浏览器提供的设备 ID', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cm-device-'))
  try {
    await saveDevice(dir, {
      channel: 'assigned',
      deviceId: 'not-allowed',
      brand: 'local',
    })
    vi.stubEnv('CM_DEVICE', JSON.stringify({ brand: 'environment' }))
    expect(await loadDevice(dir, { appVer: '1.0.0' })).toEqual({
      channel: 'assigned',
      brand: 'environment',
      appVer: '1.0.0',
    })
  } finally {
    vi.unstubAllEnvs()
    await rm(dir, { recursive: true, force: true })
  }
})
