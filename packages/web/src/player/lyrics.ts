export interface LyricLine {
  time: number
  text: string
}
export function parseLyrics(raw: string): LyricLine[] {
  const lines: LyricLine[] = []
  const offset = Number(raw.match(/\[offset:([+-]?\d+)\]/i)?.[1] ?? 0) / 1000
  for (const line of raw.split(/\r?\n/)) {
    const text = line.replace(/\[[^\]]*\]/g, '').trim()
    for (const match of line.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g))
      lines.push({
        time: Number(match[1]) * 60 + Number(match[2]) + offset,
        text,
      })
  }
  return lines.sort((a, b) => a.time - b.time)
}
export function lyricIndex(lines: LyricLine[], seconds: number) {
  let low = 0,
    high = lines.length - 1,
    found = -1
  while (low <= high) {
    const mid = (low + high) >>> 1
    if (lines[mid].time <= seconds) {
      found = mid
      low = mid + 1
    } else high = mid - 1
  }
  return found
}
