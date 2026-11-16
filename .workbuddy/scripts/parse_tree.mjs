import fs from 'node:fs'

const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const data = raw.data
const cats = data.category || []
const subs = data.subCategory || {}
const out = []
const seen = new Set()

for (const cat of cats) {
  for (const n of subs[cat.id] || []) walk(n, [cat.title])
}

function walk(node, pathArr) {
  const p = node.title ? [...pathArr, node.title] : pathArr
  const kids = Array.isArray(node.children) ? node.children : []
  if (kids.length) {
    for (const k of kids) walk(k, p)
  } else if (node.title && !seen.has(node.id)) {
    seen.add(node.id)
    out.push({
      docId: node.id,
      title: node.title,
      path: pathArr,
      content: node.content || null
    })
  }
}

const withContent = out.filter((d) => d.content && d.content.length > 20)
console.log('叶子文档数 = ' + out.length + '，其中带正文 = ' + withContent.length)
const byCat = {}
for (const d of out) {
  const c = d.path[0] || '(无)'
  byCat[c] = byCat[c] || { total: 0, body: 0 }
  byCat[c].total++
  if (d.content && d.content.length > 20) byCat[c].body++
}
for (const [k, v] of Object.entries(byCat).sort((a, b) => b[1].total - a[1].total)) {
  console.log(String(v.total).padStart(4) + ' 篇 / 有正文 ' + String(v.body).padStart(4) + '  ' + k)
}
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1))
console.log('总字符数 = ' + out.reduce((s, d) => s + (d.content ? d.content.length : 0), 0))
