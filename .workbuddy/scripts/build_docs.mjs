import fs from 'node:fs'
import path from 'node:path'
import { htmlToMd, DOC_BASE } from './html2md.mjs'

const docs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const outDir = process.argv[3]
fs.mkdirSync(outDir, { recursive: true })

const CAT_ORDER = [
  '个人接入指南',
  '厂商接入指南',
  '音乐API文档',
  '播客API文档',
  '定制API文档',
  'SDK文档',
  'CMAPI文档',
  '网易云音认证'
]

function apiPathOf(md) {
  const m = /`(\/[a-zA-Z0-9/_.{}-]+)`/.exec(md)
  return m ? m[1] : ''
}

const groups = new Map()
for (const d of docs) {
  const cat = d.path[0] || '未分类'
  const sub = d.path[1] || '其他'
  const md = htmlToMd(d.content)
  if (!groups.has(cat)) groups.set(cat, new Map())
  const subs = groups.get(cat)
  if (!subs.has(sub)) subs.set(sub, [])
  subs.get(sub).push({ ...d, md, api: apiPathOf(md) })
}

const files = []
function writeFile(name, content) {
  fs.writeFileSync(path.join(outDir, name), content, 'utf8')
  files.push({ name, size: Buffer.byteLength(content, 'utf8') })
  return content
}

const META = `> 抓取时间：2026-11-13 ｜ 来源：网易云音乐开放平台文档中心（developer.music.163.com）
> 由官方文档正文 HTML 自动转换为 Markdown，参数表、示例、错误码均按原文保留。`

function fileHeader(title, desc) {
  return `# ${title}\n\n> ${desc}\n>\n${META}\n\n---\n\n`
}

function renderBlock(cat, subs, includeFull, level) {
  const out = []
  for (const [sub, arr] of subs) {
    out.push(`${'#'.repeat(level)} ${sub}\n`)
    if (!includeFull) {
      out.push(rowsTable(arr) + '\n')
      continue
    }
    for (const a of arr) {
      out.push(`${'#'.repeat(level + 1)} ${a.title}\n`)
      out.push(`> 原文：${DOC_BASE}${a.docId}\n`)
      out.push(a.md + '\n')
    }
  }
  return out.join('\n')
}

function rowsTable(arr) {
  const head = '| 接口名称 | 路径 | 原始文档 |\n|---|---|---|\n'
  return (
    head +
    arr
      .map((a) => `| ${a.title} | ${a.api ? '`' + a.api + '`' : '—'} | [查看](${DOC_BASE}${a.docId}) |`)
      .join('\n')
  )
}

const allSubs = (cat) => groups.get(cat) || new Map()
const pick = (cat, subs) => {
  const m = new Map()
  for (const s of subs) if (allSubs(cat).has(s)) m.set(s, allSubs(cat).get(s))
  return m
}

const musicSubs = allSubs('音乐API文档')
const commonNames = ['公共', '数据规范']
const restMusic = new Map([...musicSubs].filter(([k]) => !commonNames.includes(k)))

let access =
  fileHeader('接入与鉴权', '入驻流程、应用创建、密钥与签名规则、公共参数、公共错误码') +
  '## 个人接入指南\n\n' +
  renderBlock('个人接入指南', allSubs('个人接入指南'), true, 3) +
  '\n## 厂商接入指南\n\n' +
  renderBlock('厂商接入指南', allSubs('厂商接入指南'), true, 3) +
  '\n## 公共参数与错误码\n\n' +
  renderBlock('音乐API文档', pick('音乐API文档', commonNames), true, 3)
writeFile('01-接入与鉴权.md', access)

const musicParts = []
let buf = []
let size = 0
for (const [sub, arr] of restMusic) {
  const piece = renderBlock('音乐API文档', new Map([[sub, arr]]), true, 2)
  if (size + piece.length > 420000 && buf.length) {
    musicParts.push(buf.join('\n'))
    buf = []
    size = 0
  }
  buf.push(piece)
  size += piece.length
}
if (buf.length) musicParts.push(buf.join('\n'))

const CN = ['一', '二', '三', '四', '五']
musicParts.forEach((body, i) => {
  const name = `0${i + 2}-音乐API-${i + 1}.md`
  writeFile(
    name,
    fileHeader(`音乐 API（${CN[i]}）`, '歌曲、歌单、搜索、推荐、评论、用户、播放记录等音乐类接口') + body
  )
})

writeFile(
  `0${musicParts.length + 2}-播客API.md`,
  fileHeader('播客 API', '播客、有声书、单集、播单、榜单、播客播放上报') +
    renderBlock('播客API文档', allSubs('播客API文档'), true, 2)
)

let biz = fileHeader(
  '定制 API 与 SDK（索引）',
  '面向车机、硬件与厂商合作的接口，个人开发者通常无法申请，此处仅保留索引与原文链接'
)
for (const cat of ['定制API文档', 'SDK文档', 'CMAPI文档', '网易云音认证']) {
  const subs = allSubs(cat)
  if (!subs.size) continue
  biz += `\n## ${cat}\n\n`
  for (const [sub, arr] of subs) {
    biz += `### ${sub}\n\n` + rowsTable(arr) + '\n\n'
  }
}
writeFile(`0${musicParts.length + 3}-定制API与SDK索引.md`, biz)

const idxName = `0${musicParts.length + 4}-完整接口索引.md`
let idx = `# 完整接口索引\n\n> 共 ${docs.length} 条，按板块 → 子分类排列。\n\n`
for (const cat of CAT_ORDER) {
  const subs = allSubs(cat)
  if (!subs.size) continue
  let n = 0
  for (const arr of subs.values()) n += arr.length
  idx += `## ${cat}（${n}）\n\n`
  for (const [sub, arr] of subs) idx += `### ${sub}\n\n` + rowsTable(arr) + '\n\n'
}

const catCounts = {}
for (const [cat, subs] of groups) {
  let n = 0
  for (const arr of subs.values()) n += arr.length
  catCounts[cat] = n
}

const totalSize = (extra) => files.reduce((s, f) => s + f.size, 0) + (extra || 0)

let readme = `# 网易云音乐开放平台 · 接口文档

> 覆盖 ${docs.length} 篇接口文档，由官方文档中心正文转换而成。
> 抓取时间：2026-11-13 ｜ 生成方式：官方文档 HTML → Markdown，参数表与 JSON 示例原样保留。

## 一、文档结构

| 分册 | 内容 | 大小 |
|---|---|---|
| 01-接入与鉴权.md | 入驻、创建应用、密钥、签名、公共参数、错误码 | ${(files[0].size / 1024).toFixed(0)} KB |
${musicParts
  .map(
    (_, i) =>
      `| 0${i + 2}-音乐API-${i + 1}.md | 音乐类接口（第${CN[i]}册） | ${(files[i + 1].size / 1024).toFixed(0)} KB |`
  )
  .join('\n')}
| 0${musicParts.length + 2}-播客API.md | 播客、有声书、单集、榜单 | ${(files[musicParts.length + 1].size / 1024).toFixed(0)} KB |
| 0${musicParts.length + 3}-定制API与SDK索引.md | 厂商/商务向接口（仅索引） | ${(files[musicParts.length + 2].size / 1024).toFixed(0)} KB |
| ${idxName} | 全部接口名称、路径、原文链接 | — |

## 二、板块总览

| 板块 | 接口数 | 个人开发者能否申请 |
|---|---|---|
| 个人接入指南 | ${catCounts['个人接入指南'] || 0} | ✅ 必读 |
| 厂商接入指南 | ${catCounts['厂商接入指南'] || 0} | ⚠️ 车机/硬件厂商流程，可参考签名与上线要求 |
| 音乐API文档 | ${catCounts['音乐API文档'] || 0} | ✅ 主力 |
| 播客API文档 | ${catCounts['播客API文档'] || 0} | ✅ 可用 |
| 定制API文档 | ${catCounts['定制API文档'] || 0} | ❌ 商务合作 |
| SDK文档 | ${catCounts['SDK文档'] || 0} | ❌ 商务合作 |
| CMAPI文档 | ${catCounts['CMAPI文档'] || 0} | ❌ 内容管理向 |
| 网易云音认证 | ${catCounts['网易云音认证'] || 0} | ❌ 认证业务 |

## 三、怎么调用

### 1. 请求域名

\`\`\`
https://openapi.music.163.com
\`\`\`

### 2. 请求方式

绝大多数接口同时支持 \`GET\` / \`POST\`。业务参数统一放在 \`bizContent\` 里，值是 **JSON 字符串**（需要 URL 编码）。

### 3. 公共参数

| 参数 | 必填 | 说明 |
|---|---|---|
| \`appId\` | 是 | 管控台创建应用后获得 |
| \`accessToken\` | 是 | 用户登录后换取；匿名登录也可拿到基础 token |
| \`signType\` | 是 | 固定 \`RSA_SHA256\` |
| \`timestamp\` | 是 | 毫秒级时间戳 |
| \`device\` | 是 | 设备信息 JSON 字符串（deviceType / os / appVer / channel 等） |
| \`sign\` | 是 | 用应用私钥对参数签名，规则见 01 分册「应用签名」 |

> 签名规则：参数按字典序排序 → 拼成 \`k=v&k=v\` → 用 RSA 私钥做 SHA256withRSA → Base64 作为 \`sign\`。

### 4. 最小调用示例

\`\`\`bash
curl "https://openapi.music.163.com/openapi/music/basic/song/playurl/get/v2?\\
appId=YOUR_APP_ID&\\
accessToken=YOUR_TOKEN&\\
signType=RSA_SHA256&\\
timestamp=$(date +%s000)&\\
bizContent=%7B%22songId%22%3A%22123456%22%2C%22bitrate%22%3A320%7D&\\
sign=YOUR_SIGN"
\`\`\`

### 5. 返回约定

- 成功：\`code = 200\`，业务数据在 \`data\`
- 失败：\`code\` 非 200；部分接口（如播放地址）还会用 \`subcode\` 细分原因，例如 \`10003\` 当前端无版权、\`10004\` 需购买/VIP
- 完整错误码见 01 分册「公共错误码」

## 四、做一个播放器要用的接口链路

| 步骤 | 接口 | 路径 |
|---|---|---|
| 1. 拿 token | 匿名登录 | \`/openapi/music/basic/oauth2/login/anonymous\` |
| 1b. 扫码登录 | 获取登录二维码 | \`/openapi/music/basic/user/oauth2/qrcodekey/get/v2\` |
| 2. 搜索 | 根据关键字搜索歌曲 | \`/openapi/music/basic/search/song/get/v3\` |
| 3. 歌单 | 获取歌单详情 | \`/openapi/music/basic/playlist/detail/get/v2\` |
| 3b. 歌单歌曲 | 获取歌单里的歌曲列表v5 | \`/openapi/music/basic/playlist/song/list/get/v5\` |
| 4. 播放地址 | 获取歌曲播放url | \`/openapi/music/basic/song/playurl/get/v2\` |
| 4b. 批量取地址 | 批量获取歌曲播放url | \`/openapi/music/basic/batch/song/playurl/get\` |
| 5. 歌词 | 获取歌词 | \`/openapi/music/basic/song/lyric/get/v2\` |
| 6. 冷启动内容 | 每日推荐 | \`/openapi/music/basic/recommend/songlist/get/v2\` |

> 播放地址是带签名的 CDN 链接，有效期与音频时长相关（≤25 分钟的歌地址有效 25 分钟），**不能缓存或转分发**；播放行为需按「播放数据回传」上报。

## 五、分册导航

${files.map((f) => `- [${f.name}](./${f.name})`).join('\n')}
- [${idxName}](./${idxName})

## 六、使用说明

- 本文档是官方文档的**转换产物**，字段与示例未改写；官方更新后以官网为准。
- 官方未提供 OpenAPI / Swagger 描述文件，本资料的参数表逐张转自网页表格。
- 文档中心目录里同一篇文档可能挂在多个分类下（站点索引 554 条，去重后 ${docs.length} 篇），本资料已按唯一文档去重。
- \`定制API文档\`、\`SDK文档\`、\`CMAPI文档\` 属厂商/商务向，个人入驻后通常拿不到对应接口分组，仅作索引备查。
`

writeFile('README.md', readme)
writeFile(idxName, idx)

console.log('生成目录：' + outDir)
files.forEach((f) => console.log('  ' + f.name.padEnd(28) + (f.size / 1024).toFixed(0) + ' KB'))
console.log('合计 ' + (totalSize() / 1024 / 1024).toFixed(2) + ' MB，索引 ' + docs.length + ' 条')
