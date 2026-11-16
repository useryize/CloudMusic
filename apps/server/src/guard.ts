import { timingSafeEqual } from 'node:crypto'
import type { FastifyRequest } from 'fastify'
export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}
export function trustedRequest(req: FastifyRequest, dev: boolean) {
  const host = req.headers.host ?? ''
  if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) return false
  const site = req.headers['sec-fetch-site']
  if (site && site !== 'same-origin' && site !== 'none') return false
  const origin = req.headers.origin
  return (
    !origin ||
    origin === `http://${host}` ||
    (dev && ['http://127.0.0.1:5173', 'http://localhost:5173'].includes(origin))
  )
}
export function cookieToken(cookie = '') {
  return (
    cookie
      .split(';')
      .map((x) => x.trim())
      .find((x) => x.startsWith('cm_token='))
      ?.slice(9) ?? ''
  )
}
