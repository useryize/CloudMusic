# 文档生成工具链

把网易云音乐开放平台文档中心的目录接口返回（约 2.9 MB JSON）转换成 `../../docs/` 下的分册 Markdown。

> 目的：`docs/01`~`06` 是可再生产物，官方文档更新后重跑三条命令即可整体刷新，不用手工比对。

## 依赖

- Node.js ≥ 18（实测 v22.22.2），ESM（`.mjs`）
- **零 npm 依赖**，只用 `node:fs`、`node:path` 和正则

## 四个文件

| 文件 | 行数 | 职责 |
|---|---|---|
| `parse_tree.mjs` | 43 | 入口。递归遍历 `category → subCategory → children`，只留叶子文档，输出 `{docId, title, path, content}`；按分类打印"共几篇 / 其中几篇有正文" |
| `html2md.mjs` | 143 | 转换模块（被 `build_docs` import）。HTML 正文 → Markdown：实体解码、`docId` 链接还原、表格转 pipe 表、标题层级降噪 |
| `build_docs.mjs` | 272 | 出书主程序。按 8 个一级分类分册，写 `01`~`06` + `README.md`，索引按"板块 → 子分类"组织 |
| `test_convert.mjs` | 8 | 调试用。指定一篇文档标题，只打印它转出的 Markdown，验证表格/标题处理 |

## 跑法

```bash
cd .workbuddy/scripts

# 1. 取目录（正文 HTML 就嵌在 children[].content 里，一次就够）
curl -sSL --noproxy '*' -o tree.json \
  https://interface.music.163.com/api/openplatform/developer/api/doc/category
#   实测：HTTP 200 / 3,015,133 字节 / 无需鉴权头

# 2. 抽叶子文档
node parse_tree.mjs tree.json parsed.json
#   叶子文档数 = 368，其中带正文 = 368
#   总字符数 = 2511392

# 3. 分册生成（写入 ../docs，会覆盖同名文件）
node build_docs.mjs parsed.json ../docs
```

单篇调试：

```bash
node test_convert.mjs parsed.json "获取歌单详情"
```

`--noproxy '*'` 是因为本机装了 Clash（127.0.0.1:7897），curl 会走代理导致抖动；不需要代理时去掉。

## 数据契约

`parse_tree.mjs` 期望顶层结构（即目录接口响应的 `data`）：

| 字段 | 类型 | 用途 |
|---|---|---|
| `data.category[]` | `{id, title}` | 一级分类，构成 `path[0]` |
| `data.subCategory[catId][]` | 节点树 | 二级及以下，构成 `path[1..]` |
| `node.id` / `node.title` | string | 叶子文档的 docId 与标题 |
| `node.children` | array | 有子节点就继续下钻，无子节点即为叶子 |
| `node.content` | string(HTML) | 正文，可能为 `null` |

`build_docs.mjs` 期望 `parsed.json` 每项：`{ title, path: string[], content }`。

## 产物

写入 `docs/`，共 7 个文件、约 1.28 MB：

| 文件 | 大小 | 内容 |
|---|---|---|
| `01-接入与鉴权.md` | 81 KB | 入驻、创建应用、密钥、签名、公共参数、错误码 |
| `02-音乐API-1.md` | 479 KB | 音乐接口前半（搜索、歌单、歌曲、播放地址…） |
| `03-音乐API-2.md` | 366 KB | 音乐接口后半（专辑、艺人、收藏、评论…） |
| `04-播客API.md` | 290 KB | 播客/声音/播单 |
| `05-定制API与SDK索引.md` | 25 KB | 厂商向接口与 SDK，仅索引 |
| `06-完整接口索引.md` | 68 KB | 名称 → 路径总索引 |
| `README.md` | 5 KB | 分册导航与使用说明 |

音乐部分按体量自动拆成 02/03，后续编号（`05`/`06`）由 `musicParts.length + 3` 顺推。

## ⚠️ 覆盖范围

| 会被**重写** | 不会被触碰 |
|---|---|
| `docs/01` ~ `06` | `docs/07-UI设计说明.md`（手写） |
| `docs/README.md` | `docs/接口能力说明.html`（手写） |

重跑前先 `git status` 确认工作区干净，或先 `cp -r docs docs.bak`。

## 已知坑（已修，改脚本时别踩回去）

1. **空表格**：官网部分参数表只有 `thead` 没有 `tbody`，不加判空会转出一堆 `| | |`。
2. **行首 `#` 污染标题**：CLI 类文档正文里出现 `# 注释`，转 md 时会变成标题，需按段落上下文转义。
3. **中文数字序号**：分类里用「一、二、三」，直接拿来做文件名会导致排序错乱，`build_docs` 用固定 `CAT_ORDER` 数组定序。
4. **重复文档**：站点索引 554 条，同一篇可能挂在多个分类下，按 `docId` 去重后为 368 篇（`parse_tree` 里的 `seen` Set）。
5. **索引条数不等于文档数**：`06` 的标题写「共 368 条」，但真正带接口路径的行是 **277 条**，差值是说明/指南类文档（没有 `path` 字段）。查接口时按 277 这个量级预期。

## 验收

跑完对三处：

1. `parse_tree` 输出 `叶子文档数 = 368，其中带正文 = 368`
2. `build_docs` 输出合计 ≈ `1.28 MB，索引 368 条`
3. `grep -cP '^\| [^|]+ \| `/' docs/06-完整接口索引.md` = `277`

再抽查一条：`grep "获取歌单详情" docs/06-完整接口索引.md` 应为
`/openapi/music/basic/playlist/detail/get/v2`。

## 维护

最后改动 2026-11-13（首版）。官方文档更新后：取新 `tree.json` → 重跑 → `git diff docs/`，只看新增/变更的接口段落。
