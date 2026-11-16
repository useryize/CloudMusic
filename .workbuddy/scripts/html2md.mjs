import fs from 'node:fs'

const DOC_BASE = 'https://developer.music.163.com/st/developer/document?docId='

function decode(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function resolveHref(h) {
  if (/^https?:\/\//.test(h)) return h
  const m = /docId=([a-f0-9]+)/.exec(h)
  if (m) return DOC_BASE + m[1]
  return h
}

function inline(html) {
  let s = html
  s = s.replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**')
  s = s.replace(/<b>([\s\S]*?)<\/b>/g, '**$1**')
  s = s.replace(/<code>([\s\S]*?)<\/code>/g, (m, c) => '`' + c.replace(/`/g, '') + '`')
  s = s.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, (m, h, t) => {
    const text = t.replace(/<[^>]+>/g, '').trim()
    return `[${text}](${resolveHref(h)})`
  })
  s = s.replace(/<img[^>]*src="([^"]*)"[^>]*>/g, '![]($1)')
  s = s.replace(/<br\s*\/?>/g, ' ')
  s = s.replace(/<[^>]+>/g, '')
  return decode(s).replace(/\s+/g, ' ').trim()
}

function cells(rowHtml) {
  const out = []
  const re = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g
  let m
  while ((m = re.exec(rowHtml))) out.push(inline(m[1]).replace(/\|/g, '\\|'))
  return out
}

function table(md) {
  const thead = /<thead>([\s\S]*?)<\/thead>/.exec(md)
  const tbody = /<tbody>([\s\S]*?)<\/tbody>/.exec(md)
  const rows = []
  const bodyHtml = tbody ? tbody[1] : md
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g
  let m
  if (thead) {
    const hr = rowRe.exec(thead[1])
    if (hr) rows.push(cells(hr[1]))
    rowRe.lastIndex = 0
  }
  while ((m = rowRe.exec(bodyHtml))) rows.push(cells(m[1]))
  const clean = rows.filter((r) => r.length > 0)
  if (clean.length < 2) return ''
  const width = Math.max(...clean.map((r) => r.length))
  const pad = (r) => {
    const c = r.slice()
    while (c.length < width) c.push('')
    return c
  }
  const header = pad(clean[0])
  const lines = [
    '| ' + header.join(' | ') + ' |',
    '|' + header.map(() => '---').join('|') + '|'
  ]
  for (const r of clean.slice(1)) lines.push('| ' + pad(r).join(' | ') + ' |')
  return lines.join('\n')
}

function list(html, ordered) {
  const items = []
  const re = /<li[^>]*>([\s\S]*?)<\/li>/g
  let m
  let i = 1
  while ((m = re.exec(html))) {
    let t = inline(m[1])
    if (!t) continue
    if (/^#{1,6}\s+/.test(t)) t = '**' + t.replace(/^#{1,6}\s+/, '').replace(/\*\*/g, '') + '**'
    items.push((ordered ? `${i++}. ` : '- ') + t)
  }
  return items.join('\n')
}

export function htmlToMd(html, opts = {}) {
  const skipFirstH2 = opts.skipFirstH2 !== false
  const blocks = []
  const re =
    /<pre[^>]*>([\s\S]*?)<\/pre>|<table[^>]*>([\s\S]*?)<\/table>|<h([1-6])[^>]*>([\s\S]*?)<\/h\3>|<ul[^>]*>([\s\S]*?)<\/ul>|<ol[^>]*>([\s\S]*?)<\/ol>|<blockquote[^>]*>([\s\S]*?)<\/blockquote>|<p[^>]*>([\s\S]*?)<\/p>/g
  let m
  let h2seen = 0
  while ((m = re.exec(html))) {
    if (m[1] !== undefined) {
      let code = m[1].replace(/<[^>]+>/g, '')
      code = decode(code).replace(/^\n+|\n+$/g, '')
      if (!code.trim()) continue
      const fence = code.includes('```') ? '````' : '```'
      const lang = /[{[]/.test(code.slice(0, 3)) || /^\s*[{[]/.test(code) ? 'json' : ''
      blocks.push(fence + lang + '\n' + code + '\n' + fence)
    } else if (m[2] !== undefined) {
      const t = table(m[2])
      if (t) blocks.push(t)
    } else if (m[3] !== undefined) {
      const level = Number(m[3])
      const text = inline(m[4])
      if (!text) continue
      if (level === 2) {
        h2seen++
        if (skipFirstH2 && h2seen === 1) continue
      }
      if (/^\/?(openapi|api)\//i.test(text)) {
        blocks.push('**接口路径**\n\n`' + text.replace(/`/g, '') + '`')
      } else if (level === 1) {
        blocks.push('**' + text.replace(/\*\*/g, '') + '**')
      } else if (level >= 3) {
        blocks.push('**' + text.replace(/\*\*/g, '') + '**')
      } else {
        blocks.push('#### ' + text)
      }
    } else if (m[5] !== undefined) {
      const t = list(m[5], false)
      if (t) blocks.push(t)
    } else if (m[6] !== undefined) {
      const t = list(m[6], true)
      if (t) blocks.push(t)
    } else if (m[7] !== undefined) {
      const t = inline(m[7])
      if (t) blocks.push('> ' + t)
    } else if (m[8] !== undefined) {
      let t = inline(m[8])
      if (!t) continue
      if (/^#{1,6}\s+/.test(t)) t = '**' + t.replace(/^#{1,6}\s+/, '').replace(/\*\*/g, '') + '**'
      blocks.push(t)
    }
  }
  return blocks.join('\n\n')
}

export { DOC_BASE }
