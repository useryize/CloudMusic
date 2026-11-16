export function duration(seconds: number) {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0))
  return `${Math.floor(safe / 60)
    .toString()
    .padStart(2, '0')}:${(safe % 60).toString().padStart(2, '0')}`
}
export function count(n = 0) {
  return n >= 100000000
    ? `${(n / 100000000).toFixed(1)}亿`
    : n >= 10000
      ? `${(n / 10000).toFixed(1)}万`
      : String(n)
}
