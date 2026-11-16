import { createSign } from 'node:crypto'
export function signingContent(
  params: Record<string, string | number | null | undefined>,
) {
  return Object.keys(params)
    .filter((k) => k !== 'sign' && params[k] !== '' && params[k] != null)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
}
export function sign(params: Record<string, string | number>, key: string) {
  return createSign('RSA-SHA256')
    .update(signingContent(params), 'utf8')
    .sign(key, 'base64')
}
