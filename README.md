# 云音乐 PC

按 [前端架构](docs/08-前端架构.md) 和 [运行形态](docs/09-运行形态与打包.md) 搭建。M0 骨架已落地，M1–M3 浏览、播放与个人音乐功能已接入代码，真实业务验收仍受平台接入条件限制。

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

在「应用配置」页填写自己的 appId 与 RSA 私钥（支持 PEM 或 Base64 正文），或通过服务端环境变量 `CM_APP_ID`、`CM_PRIVATE_KEY` 配置（环境变量优先）。可选填 AppSecret，用于登录 Token 自动续期；环境变量名为 `CM_APP_SECRET`。凭证不写入前端产物，不返回已保存私钥。首页「接口连接测试」验证热搜 API。没有凭证时返回 409 并提供配置入口。

应用凭证保存在数据目录的 `credentials.json`，登录凭证在 `session.json`，稳定设备 ID 在 `device-id`，设备参数在 `device.json`。当前是文件存储，并未实现 DPAPI / safeStorage 加密。只返回登录状态，OAuth Token 不返回页面。

### 平台接入限制（2026-11-16 实测）

用户已确认 M0 热搜测试成功；本轮对推荐歌单、搜索和榜单执行真实只读联调时，平台返回「公共参数校验失败，请检查 os/channel/brand 等是否符合约定」。这不等于其他接口已经开通。官方资料的个人接入 FAQ 指向 ncm-cli；厂商公共参数要求 channel / os / brand 等由平台约定，不能从 AppID、AppSecret、PubKey、PrivateKey 推导。

后续对实际调用链的诊断确认：无登录态时，业务请求会先初始化匿名会话，当前真正失败的是 `/openapi/music/basic/oauth2/login/anonymous`，业务查询尚未发出。服务现返回 `DEVICE_PARAMETERS_REJECTED` 诊断、失败接口路径与缺失字段名，不返回秘密或设备字段值。

若已有平台分配的设备参数，可在「应用配置 → 设备参数」填写，或用服务端 `CM_DEVICE` JSON 覆盖。普通配置的加载顺序为 `CM_DEVICE` → 数据目录 `device.json` → 仓库 `config/default.json`；本机设备 ID 由服务维护，不能由浏览器覆盖。默认配置不再填未经平台确认的厂商标识。只有四项应用凭证的个人应用，需要先确认官方支持的接入方式；当前没有偷偷转用非官方接口或调用 CLI。

## 当前范围

- `packages/core`：签名、凭证与设备配置、三并发队列、在途只读请求去重、匿名 / 扫码登录、Token 持久化与续期。
- `apps/server`：Fastify、本地鉴权、配置与 RPC、静态 SPA 托管、播放地址解析和短期音频票据、CDN 与地址校验、Range / 206 透传。OAuth 和播放地址接口禁止通过通用 RPC 绕过专用路由。
- M1：发现、歌单、专辑、艺人、排行榜、每日推荐；真实接口适配、封面卡、收藏操作、分页虚拟歌曲列表与加载 / 空态 / 错误提示。
- M2：全局 HTMLAudioElement 与 AudioContext、队列 / 循环 / 随机 / 音量 / 音质、进度拖动、全屏播放与 LRC 歌词、解析竞态保护、音源错误重取及连续失败停止。播放地址不进入 Query、Zustand 或 localStorage；列表附带直链在服务端剔除。播放上报记录实际听音时长，开始与结束分别上报，暂停和拖动不重复产生 startplay。
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

密钥扫描读取暂存区版本。浏览器测试使用本地接口桩和静音 WAV，不会向真实账号发布评论；Windows 默认使用已安装的 Edge，其他平台先执行 `pnpm exec playwright install chromium`。截图在 `test-results/`，目录被 Git 忽略。真实平台登录、连续播放和评论发布仍需在应用权限可用后验收，不能把本地测试通过视为真实接口联通。

详细进度维护在 [.workbuddy/memory/2026-11-16.md](.workbuddy/memory/2026-11-16.md)。下载接口尚未实现。
