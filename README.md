# 云音乐 PC

按 [前端架构](docs/08-前端架构.md) 和 [运行形态](docs/09-运行形态与打包.md) 搭建。默认通过官方 CLI 接入个人账号，已验证真实搜索、每日推荐、雷达歌单、歌单详情与歌曲列表。

## 开发

需要 Node >= 20.19 和 pnpm 10。

```sh
pnpm install
pnpm dev
```

访问 http://127.0.0.1:5173 。没有全局 pnpm 时，可将命令中的 `pnpm` 换成 `npx -y pnpm@10.11.0`（Windows 使用 `npx.cmd`）。

## 构建与本地运行

```sh
pnpm build
pnpm start
```

生产服务绑定 127.0.0.1 的随机端口，通过终端完整启动链接访问。支持 `--port <端口>` 和 `--open`。`CM_DATA_DIR` 可覆盖本地数据目录，默认 `~/.cloudmusic`。使用令牌链接交换 HttpOnly Cookie；直接访问提供令牌输入引导。

在「应用配置」页填写自己的 appId 与 RSA 私钥（支持 PEM 或 Base64 正文），保存时同步到官方 CLI 配置，然后通过页面或 `pnpm cli:login` 完成扫码。服务端环境变量 `CM_APP_ID`、`CM_PRIVATE_KEY` 优先于项目凭证文件；只设置环境变量时，也需要通过 CLI 配置向导完成 CLI 自身的配置。凭证不写入前端产物，不返回已保存私钥。CLI 模式的首页连接测试检查官方登录状态。

项目应用凭证保存在数据目录的 `credentials.json`。CLI 模式的用户登录态由官方 CLI 自身维护，页面只接收登录状态和业务数据，不读取 OAuth Token。项目文件尚未实现 DPAPI / safeStorage 加密。

### 接入方式与平台限制（2026-11-16 实测）

默认 `CM_BACKEND=cli`（省略时也是 CLI）。本地 HTTP 服务对前端接口进行白名单映射，转调 `@music163/ncm-cli@0.1.7`；用户扫码后已通过项目 HTTP 服务验证搜索、每日推荐、雷达歌单、歌单详情和歌曲列表均返回 200。CLI 的数据命令在登录后才加载，未登录时 `search` 可能显示 unknown command，不代表该版本没有搜索能力。

用户已确认 M0 热搜测试成功；本轮对推荐歌单、搜索和榜单执行真实只读联调时，平台返回「公共参数校验失败，请检查 os/channel/brand 等是否符合约定」。这不等于其他接口已经开通。官方资料的个人接入 FAQ 指向 ncm-cli；厂商公共参数要求 channel / os / brand 等由平台约定，不能从 AppID、AppSecret、PubKey、PrivateKey 推导。

历史 HTTP 直连的失败发生在初始化匿名会话 `/openapi/music/basic/oauth2/login/anonymous`，早于业务查询。保留该模式供具备厂商接入条件时使用：设置 `CM_BACKEND=direct`。错误诊断会返回失败路径与缺失字段名，不返回秘密或设备字段值。

直连模式中，已有平台分配的设备参数时可在「应用配置 → 设备参数」填写，或用 `CM_DEVICE` JSON 覆盖，优先级为环境变量 → 本机 `device.json` → `config/default.json`。CLI 模式不要求用户填写这些厂商字段，也不使用非官方 API。

## 当前范围

- `packages/core`：签名、凭证与设备配置、三并发队列、在途只读请求去重、匿名 / 扫码登录、Token 持久化与续期。
- `apps/server`：Fastify、本地鉴权、配置与 RPC、静态 SPA 托管、播放地址解析和短期音频票据、CDN 与地址校验、Range / 206 透传。OAuth 和播放地址接口禁止通过通用 RPC 绕过专用路由。
- CLI 模式：已映射搜索、雷达歌单、每日推荐、歌单 / 专辑详情与歌曲、艺人歌曲、个人资料 / 红心 / 收藏 / 历史、歌词及评论命令。读取结果最多缓存 60 秒；写操作不去重，退出登录丢弃在途旧数据。艺人基础信息来自此前歌曲 / 搜索返回的真实元信息，CLI 没有独立详情命令时不编造简介。
- CLI 模式首页展示「雷达歌单」「为你推荐」；当前没有对应命令的排行榜、艺人专辑、歌单 / 专辑收藏、最新评论和匿名体验不开放。旧直连模式保留原能力。
- M1：发现、歌单、专辑、艺人、排行榜、每日推荐；真实接口适配、封面卡、收藏操作、分页虚拟歌曲列表与加载 / 空态 / 错误提示。
- M2：全局 HTMLAudioElement 与 AudioContext、队列 / 循环 / 随机 / 音量 / 音质、进度拖动、全屏播放与 LRC 歌词、解析竞态保护、音源错误重取及连续失败停止。播放地址不进入 Query、Zustand 或 localStorage；列表附带直链在服务端剔除。播放上报记录实际听音时长，开始与结束分别上报，暂停和拖动不重复产生 startplay。
- 上一条浏览器音频链路属于直连模式。默认 CLI 模式通过 `/api/player/action` 与 `/api/player/state` 控制官方本地播放器，使用加密 ID + 原始 ID，不取音频直链，不重复上报或提供浏览器音质切换；状态前台约 1 秒、后台约 4 秒查询一次。播放需要本机 mpv，尚未完成本机真实出声和连续播放验收。
- M3：本地二维码生成、扫码轮询、匿名体验、我的音乐（资料 / 最近播放 / 红心 / 收藏歌单）、7 个搜索分类入口、综合搜索部分失败兜底、评论读取 / 发布 / 回复。
- 评论正文与发评依赖对应接口组权限；普通 `comments/get/v2` 文档注明目前可能只返回数量。加密歌曲 ID 无法直接推导 `threadId`，发表时需要原始数字 ID 或歌曲分享链接；没有编造评论主题。短分享链接需先在浏览器打开成含歌曲 ID 的完整链接。
- 歌单广场额外提供推荐歌单浏览；M4 播客频道、视频、一起听仍是占位。M5 Electron 外壳、安装包与系统加密存储尚未实现。
- 开发代理改写 Host，服务端只额外允许明确的 Vite Origin；生产始终校验同源和 Cookie。开发模式仅用于本机开发。

## 检查

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm check:secrets
pnpm build
pnpm e2e
node scripts/smoke.mjs
```

密钥扫描读取暂存区版本。自动化浏览器测试使用本地接口桩、静音 WAV 和 CLI 控制桩，不会向真实账号发布评论；Windows 默认使用已安装的 Edge，其他平台先执行 `pnpm exec playwright install chromium`。截图在 `test-results/`，目录被 Git 忽略。真实账号登录和部分只读查询已经验证，真实播放与评论发布仍待验收。

详细进度维护在 [.workbuddy/memory/2026-11-16.md](.workbuddy/memory/2026-11-16.md)。下载接口尚未实现。

## 官方 CLI 登录与命令

本地服务已默认切换为官方 `@music163/ncm-cli@0.1.7` 适配。登录后加载搜索、推荐、歌单、用户等数据命令，CLI 能力不完全等同于原始 HTTP 接口清单。

```sh
pnpm cli:login
pnpm cli:status
pnpm cli:commands
```

在项目根目录运行。没有全局 pnpm 时使用 `npx.cmd -y pnpm@10.11.0 cli:login`。首次 CLI 配置也可通过 `pnpm -C apps/server exec ncm-cli configure` 完成。网页登录状态、登录二维码和退出登录现已接入 CLI；旧直连模式的 `session.json` 不会自动迁移为 CLI 会话。
