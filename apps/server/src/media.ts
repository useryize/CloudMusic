import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { Readable } from 'node:stream'
import { randomBytes } from 'node:crypto'
import { request as httpsRequest } from 'node:https'
import type { FastifyInstance } from 'fastify'
async function fetchPinned(
  url: string,
  init: RequestInit,
  address: { address: string; family: number },
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const request = httpsRequest(
      url,
      {
        headers: init.headers as Record<string, string>,
        signal: init.signal ?? undefined,
        lookup: (_hostname, options, callback) => {
          if (options.all) callback(null, [address])
          else callback(null, address.address, address.family)
        },
      },
      (incoming) => {
        const headers = new Headers()
        for (let i = 0; i < incoming.rawHeaders.length; i += 2)
          headers.append(incoming.rawHeaders[i], incoming.rawHeaders[i + 1])
        const status = incoming.statusCode ?? 502
        resolve(
          new Response(
            [204, 205, 304].includes(status)
              ? null
              : (Readable.toWeb(incoming) as ReadableStream<Uint8Array>),
            { status, headers },
          ),
        )
      },
    )
    request.on('error', reject)
    request.end()
  })
}
export function allowedCdn(raw: string) {
  try {
    const u = new URL(raw)
    return (
      u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      (!u.port || u.port === '443') &&
      ['music.126.net', 'music.163.com'].some(
        (d) => u.hostname === d || u.hostname.endsWith('.' + d),
      )
    )
  } catch {
    return false
  }
}
export function publicAddress(ip: string) {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number)
    return (
      a !== 0 &&
      a !== 10 &&
      a !== 127 &&
      !(a === 169 && b === 254) &&
      !(a === 172 && b >= 16 && b <= 31) &&
      !(a === 192 && b === 168) &&
      !(a === 100 && b >= 64 && b <= 127) &&
      a < 224
    )
  }
  return isIP(ip) === 6 && /^[23]/i.test(ip)
}
export function createMediaRoutes(
  app: FastifyInstance,
  options: {
    resolve?: (host: string) => Promise<{ address: string; family: number }[]>
    transport?: typeof fetch
  } = {},
) {
  const tickets = new Map<string, { url: string; expires: number }>()
  app.get<{ Params: { ticket: string } }>(
    '/api/audio/:ticket',
    async (req, reply) => {
      const entry = tickets.get(req.params.ticket)
      if (!entry || entry.expires < Date.now())
        return reply
          .code(410)
          .send({ code: 410, msg: '播放地址已失效，请重试' })
      let url = entry.url
      for (let i = 0; i < 5; i++) {
        if (!allowedCdn(url))
          return reply.code(403).send({ code: 403, msg: '音频地址不允许' })
        const addresses = await (options.resolve
          ? options.resolve(new URL(url).hostname)
          : lookup(new URL(url).hostname, { all: true }))
        if (
          !addresses.length ||
          addresses.some((x) => !publicAddress(x.address))
        )
          return reply.code(403).send({ code: 403 })
        const controller = new AbortController()
        req.raw.on('close', () => {
          if (req.raw.aborted) controller.abort()
        })
        reply.raw.on('close', () => controller.abort())
        const timeout = setTimeout(() => controller.abort(), 15000)
        const init: RequestInit = {
          headers: req.headers.range ? { Range: req.headers.range } : {},
          redirect: 'manual',
          signal: controller.signal,
        }
        const upstream = await (
          options.transport
            ? options.transport(url, init)
            : fetchPinned(url, init, addresses[0])
        ).finally(() => clearTimeout(timeout))
        if ([301, 302, 303, 307, 308].includes(upstream.status)) {
          await upstream.body?.cancel()
          const location = upstream.headers.get('location')
          if (!location) break
          url = new URL(location, url).href
          continue
        }
        reply.code(upstream.status)
        for (const h of [
          'content-type',
          'content-length',
          'content-range',
          'accept-ranges',
        ]) {
          const value = upstream.headers.get(h)
          if (value) reply.header(h, value)
        }
        if (!upstream.body) return reply.send()
        return reply.send(
          Readable.fromWeb(
            upstream.body as import('node:stream/web').ReadableStream,
          ),
        )
      }
      return reply.code(502).send({ code: 502, msg: '音频跳转次数过多' })
    },
  )
  return {
    issue(raw: string, expires?: number) {
      const url = new URL(raw)
      if (url.protocol === 'http:') url.protocol = 'https:'
      if (!allowedCdn(url.href)) throw new Error('音频地址不允许')
      for (const [key, value] of tickets)
        if (value.expires < Date.now()) tickets.delete(key)
      if (tickets.size >= 32) tickets.delete(tickets.keys().next().value!)
      const ticket = randomBytes(24).toString('hex')
      tickets.set(ticket, {
        url: url.href,
        expires: Math.min(
          expires || Date.now() + 25 * 60000,
          Date.now() + 25 * 60000,
        ),
      })
      return `/api/audio/${ticket}`
    },
    clear: () => tickets.clear(),
  }
}
