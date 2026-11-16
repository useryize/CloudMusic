# 云音乐 PC

按 [前端架构](docs/08-前端架构.md) 和 [运行形态](docs/09-运行形态与打包.md) 搭建的 M0 工程。

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

在「应用配置」页填写自己的 appId 与 RSA PEM 私钥，或通过服务端环境变量 `CM_APP_ID`、`CM_PRIVATE_KEY` 配置（环境变量优先）。凭证不写入前端产物，不返回已保存私钥。首页「测试请求」验证真实热搜 API，`/playlist/:id` 可查询真实歌单详情。没有凭证时返回 409 并提供配置入口。

## 当前范围

- `packages/core`：签名、凭证加载、三并发队列与在途去重。
- `apps/server`：Fastify、Host/Origin 校验、启动令牌、配置与 RPC、静态 SPA 托管。
- `packages/web`：React 19、Vite 6、Router 7、Query 5、Zustand 5、CSS Modules、设计 token、15 个设计路由和公共布局。
- M0 接口结果以调试数据展示，其他业务页为明确的阶段占位。M1 接入浏览页面；M2 接入音频、队列、歌词；M3/M4 接入登录、搜索、评论等业务；M5 增加可选 Electron 外壳和安装包。
- 开发代理改写 Host，服务端只额外允许明确的 Vite Origin；生产始终校验同源和 Cookie。开发模式仅用于本机开发。

## 检查

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm check:secrets
pnpm build
```

密钥扫描读取暂存区版本。未添加凭证，真实开放平台联调需自行在本机配置。音频代理、OAuth 和下载路由尚未开放。
