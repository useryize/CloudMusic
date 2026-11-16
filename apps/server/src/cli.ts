import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { PlatformError } from '@cloudmusic/core'

export interface CliResult {
  success?: boolean
  code?: number
  message?: string
  data?: unknown
  [key: string]: unknown
}
export function parseCliOutput(output: string): CliResult {
  // eslint-disable-next-line no-control-regex -- 移除 CLI 输出的 ANSI 颜色序列。
  const clean = output.replace(/\u001b\[[0-9;]*m/g, '').trim()
  try {
    const result: unknown = JSON.parse(clean)
    if (result && typeof result === 'object' && !Array.isArray(result))
      return result as CliResult
  } catch {
    /* 兼容命令在 JSON 前输出状态行。 */
  }
  for (const line of clean.split(/\r?\n/).reverse()) {
    try {
      const result: unknown = JSON.parse(line)
      if (result && typeof result === 'object' && !Array.isArray(result))
        return result as CliResult
    } catch {
      /* 继续寻找完整 JSON 行。 */
    }
  }
  throw new PlatformError(
    502,
    '官方 CLI 未返回有效 JSON，请检查 CLI 配置或版本',
  )
}
export function createCliRunner(
  entry = createRequire(import.meta.url).resolve('@music163/ncm-cli'),
) {
  let active = 0
  const waiting: Array<() => void> = []
  return async function run(
    args: string[],
    options: {
      timeout?: number
      allowFailure?: boolean
      statusOnly?: boolean
    } = {},
  ): Promise<CliResult> {
    if (active >= 3) await new Promise<void>((resolve) => waiting.push(resolve))
    active++
    try {
      return await new Promise<CliResult>((resolve, reject) => {
        const child = spawn(
          process.execPath,
          [entry, ...args, '--output', 'json'],
          {
            shell: false,
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        )
        let output = ''
        let size = 0
        let tooLarge = false
        let timedOut = false
        const timer = setTimeout(() => {
          timedOut = true
          child.kill()
        }, options.timeout ?? 30000)
        child.stdout.setEncoding('utf8')
        child.stdout.on('data', (chunk: string) => {
          size += Buffer.byteLength(chunk)
          if (size > 8 * 1024 * 1024) {
            tooLarge = true
            child.kill()
          } else output += chunk
        })
        // CLI 的原始 stderr 可能含敏感信息，不写入日志或返回页面。
        child.stderr.resume()
        child.once('error', () => {
          clearTimeout(timer)
          reject(
            new PlatformError(
              503,
              '无法启动官方 CLI，请检查项目依赖是否安装完整',
            ),
          )
        })
        child.once('close', (code) => {
          clearTimeout(timer)
          if (timedOut)
            return reject(new PlatformError(504, '官方 CLI 请求超时，请重试'))
          if (tooLarge)
            return reject(
              new PlatformError(502, '官方 CLI 返回数据过大，请减少查询数量'),
            )
          if (options.statusOnly) {
            if (code === 0) return resolve({ success: true })
            return reject(
              new PlatformError(
                502,
                '官方 CLI 配置失败，请检查 CLI 安装与本机权限',
              ),
            )
          }
          try {
            const result = parseCliOutput(output)
            if (
              !options.allowFailure &&
              (code !== 0 ||
                result.success === false ||
                (typeof result.code === 'number' &&
                  result.code !== 200 &&
                  result.code !== 0))
            )
              return reject(
                new PlatformError(
                  result.code === 401 ? 401 : 502,
                  '官方 CLI 请求失败，请检查登录状态及接口权限',
                ),
              )
            resolve(result)
          } catch (error) {
            reject(error)
          }
        })
      })
    } finally {
      active--
      waiting.shift()?.()
    }
  }
}
