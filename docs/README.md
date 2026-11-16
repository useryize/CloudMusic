# 网易云音乐开放平台 · 接口文档

> 覆盖 368 篇接口文档，由官方文档中心正文转换而成。
> 抓取时间：2026-11-13 ｜ 生成方式：官方文档 HTML → Markdown，参数表与 JSON 示例原样保留。

> **先看这个**：[接口能力说明.html](./接口能力说明.html) —— 一页讲清这些接口能做什么、做不到什么、要按什么顺序接。

## 一、文档结构

| 分册 | 内容 | 大小 |
|---|---|---|
| 01-接入与鉴权.md | 入驻、创建应用、密钥、签名、公共参数、错误码 | 81 KB |
| 02-音乐API-1.md | 音乐类接口（第一册） | 479 KB |
| 03-音乐API-2.md | 音乐类接口（第二册） | 366 KB |
| 04-播客API.md | 播客、有声书、单集、榜单 | 290 KB |
| 05-定制API与SDK索引.md | 厂商/商务向接口（仅索引） | 25 KB |
| 06-完整接口索引.md | 全部接口名称、路径、原文链接 | — |

## 二、板块总览

| 板块 | 接口数 | 个人开发者能否申请 |
|---|---|---|
| 个人接入指南 | 5 | ✅ 必读 |
| 厂商接入指南 | 14 | ⚠️ 车机/硬件厂商流程，可参考签名与上线要求 |
| 音乐API文档 | 146 | ✅ 主力 |
| 播客API文档 | 65 | ✅ 可用 |
| 定制API文档 | 102 | ❌ 商务合作 |
| SDK文档 | 25 | ❌ 商务合作 |
| CMAPI文档 | 10 | ❌ 内容管理向 |
| 网易云音认证 | 1 | ❌ 认证业务 |

## 三、怎么调用

### 1. 请求域名

```
https://openapi.music.163.com
```

### 2. 请求方式

绝大多数接口同时支持 `GET` / `POST`。业务参数统一放在 `bizContent` 里，值是 **JSON 字符串**（需要 URL 编码）。

### 3. 公共参数

| 参数 | 必填 | 说明 |
|---|---|---|
| `appId` | 是 | 管控台创建应用后获得 |
| `accessToken` | 是 | 用户登录后换取；匿名登录也可拿到基础 token |
| `signType` | 是 | 固定 `RSA_SHA256` |
| `timestamp` | 是 | 毫秒级时间戳 |
| `device` | 是 | 设备信息 JSON 字符串（deviceType / os / appVer / channel 等） |
| `sign` | 是 | 用应用私钥对参数签名，规则见 01 分册「应用签名」 |

> 签名规则：参数按字典序排序 → 拼成 `k=v&k=v` → 用 RSA 私钥做 SHA256withRSA → Base64 作为 `sign`。

### 4. 最小调用示例

```bash
curl "https://openapi.music.163.com/openapi/music/basic/song/playurl/get/v2?\
appId=YOUR_APP_ID&\
accessToken=YOUR_TOKEN&\
signType=RSA_SHA256&\
timestamp=$(date +%s000)&\
bizContent=%7B%22songId%22%3A%22123456%22%2C%22bitrate%22%3A320%7D&\
sign=YOUR_SIGN"
```

### 5. 返回约定

- 成功：`code = 200`，业务数据在 `data`
- 失败：`code` 非 200；部分接口（如播放地址）还会用 `subcode` 细分原因，例如 `10003` 当前端无版权、`10004` 需购买/VIP
- 完整错误码见 01 分册「公共错误码」

## 四、做一个播放器要用的接口链路

| 步骤 | 接口 | 路径 |
|---|---|---|
| 1. 拿 token | 匿名登录 | `/openapi/music/basic/oauth2/login/anonymous` |
| 1b. 扫码登录 | 获取登录二维码 | `/openapi/music/basic/user/oauth2/qrcodekey/get/v2` |
| 2. 搜索 | 根据关键字搜索歌曲 | `/openapi/music/basic/search/song/get/v3` |
| 3. 歌单 | 获取歌单详情 | `/openapi/music/basic/playlist/detail/get/v2` |
| 3b. 歌单歌曲 | 获取歌单里的歌曲列表v5 | `/openapi/music/basic/playlist/song/list/get/v5` |
| 4. 播放地址 | 获取歌曲播放url | `/openapi/music/basic/song/playurl/get/v2` |
| 4b. 批量取地址 | 批量获取歌曲播放url | `/openapi/music/basic/batch/song/playurl/get` |
| 5. 歌词 | 获取歌词 | `/openapi/music/basic/song/lyric/get/v2` |
| 6. 冷启动内容 | 每日推荐 | `/openapi/music/basic/recommend/songlist/get/v2` |

> 播放地址是带签名的 CDN 链接，有效期与音频时长相关（≤25 分钟的歌地址有效 25 分钟），**不能缓存或转分发**；播放行为需按「播放数据回传」上报。

## 五、分册导航

- [01-接入与鉴权.md](./01-接入与鉴权.md)
- [02-音乐API-1.md](./02-音乐API-1.md)
- [03-音乐API-2.md](./03-音乐API-2.md)
- [04-播客API.md](./04-播客API.md)
- [05-定制API与SDK索引.md](./05-定制API与SDK索引.md)
- [06-完整接口索引.md](./06-完整接口索引.md)

## 六、使用说明

- 本文档是官方文档的**转换产物**，字段与示例未改写；官方更新后以官网为准。
- 官方未提供 OpenAPI / Swagger 描述文件，本资料的参数表逐张转自网页表格。
- 文档中心目录里同一篇文档可能挂在多个分类下（站点索引 554 条，去重后 368 篇），本资料已按唯一文档去重。
- `定制API文档`、`SDK文档`、`CMAPI文档` 属厂商/商务向，个人入驻后通常拿不到对应接口分组，仅作索引备查。

## 七、配套设计文档

以下三份**不是官方文档的转换产物**，是本项目自己的设计稿，手写维护，`build_docs.mjs` 不会覆盖：

| 文档 | 内容 | 依赖 |
|---|---|---|
| [07-UI设计说明.md](./07-UI设计说明.md) | 15 个 PC 端画板的结构、数据位、设计 token、接口映射 | 读 `06` |
| [08-前端架构.md](./08-前端架构.md) | ADR、数据层、状态层、页面拆解、性能预算、里程碑 | 读 `06` `07` |
| [09-运行形态与打包.md](./09-运行形态与打包.md) | 本地 Node 服务、本地鉴权、凭证管理、安装包构建 | 修订 `08` 的 6 处 |

阅读顺序：接口怎么调（`01`~`06`）→ 界面怎么长（`07`）→ 代码怎么组织（`08`）→ 怎么跑和怎么打包（`09`）。
