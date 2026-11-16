import { execFileSync } from 'node:child_process'
const files = execFileSync(
  'git',
  ['diff', '--cached', '--name-only', '--diff-filter=ACM', '-z'],
  { encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean)
let hits = 0
for (const file of files) {
  if (/\.(png|jpg|ico|woff2?|lock)$/i.test(file)) continue
  const text = execFileSync('git', ['show', `:${file}`], { encoding: 'utf8' })
  if (
    /-----BEGIN (RSA )?PRIVATE KEY-----/.test(text) ||
    /["']?(accessToken|refreshToken)["']?\s*[:=]\s*["'][0-9a-f]{40,}/i.test(
      text,
    )
  ) {
    console.error(`疑似凭证：${file}`)
    hits++
  }
}
if (hits) process.exit(1)
