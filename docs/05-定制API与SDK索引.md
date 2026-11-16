# 定制 API 与 SDK（索引）

> 面向车机、硬件与厂商合作的接口，个人开发者通常无法申请，此处仅保留索引与原文链接
>
> 抓取时间：2026-11-13 ｜ 来源：网易云音乐开放平台文档中心（developer.music.163.com）
> 由官方文档正文 HTML 自动转换为 Markdown，参数表、示例、错误码均按原文保留。

---


## 定制API文档

### 公共

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 前端 SDK | — | [查看](https://developer.music.163.com/st/developer/document?docId=1af0762ed8664d8e9da63cb980f0d986) |

### 歌曲物料推送

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 推送接入说明 | — | [查看](https://developer.music.163.com/st/developer/document?docId=2a6c6560bc9f42c289258a49604bc302) |
| 离线推送 | — | [查看](https://developer.music.163.com/st/developer/document?docId=ae42aef53e264ae6b516e6a839893012) |
| 实时推送 | — | [查看](https://developer.music.163.com/st/developer/document?docId=d0fabd473b93423ca996d80acaba5874) |
| 查询元数据详情 | `/openapi/music/basic/song/cio/detail/get` | [查看](https://developer.music.163.com/st/developer/document?docId=fcc6453d20d14a86b58c6d679ef0a597) |

### 移动端评论API

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 歌曲用户评论 | `/openapi/music/comment/user/get-user-comments-by-song` | [查看](https://developer.music.163.com/st/developer/document?docId=2bafceccb1bc4b7b9fdf34e0a5efa316) |
| 论回复列表2 | `/openapi/music/resource/comment/reply/list/asc` | [查看](https://developer.music.163.com/st/developer/document?docId=9c083dbdfa4540428bea61beda3a3e9f) |
| 获取评论 | `/openapi/music/basic/comments/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=459731c083e14476ba1918209804435f) |
| 发布一级评论 | `/openapi/v1/resource/comments/add` | [查看](https://developer.music.163.com/st/developer/document?docId=9c22b68279014c609f390ad9ee3d07c4) |
| 回复评论 | `/openapi/v1/resource/comments/reply` | [查看](https://developer.music.163.com/st/developer/document?docId=c67d802a66c24144b493a0a543c0c90a) |
| 一级评论列表2 | `/openapi/music/resource/comment/lv1/list/desc` | [查看](https://developer.music.163.com/st/developer/document?docId=d1a7db22f5c64e59ababda0bcb670b30) |

### 歌曲API

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 批量获取歌曲bpm | `/openapi/music/basic/song/bpm/get` | [查看](https://developer.music.163.com/st/developer/document?docId=0f06b20e0ea549628f3c56ec10d57e4d) |

### 分享API

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 获取资源短链 | `/openapi/music/resource/short/url/get` | [查看](https://developer.music.163.com/st/developer/document?docId=e0925b45343f440880345a64920bc21d) |

### AI写歌

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 查询歌曲生产作品详情 | `/openapi/ai/factory/user/song/generate/production/detail` | [查看](https://developer.music.163.com/st/developer/document?docId=6b36a99bfebb4abcbad8a59c23ea31a6) |

### 音效API

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 音效v2使用指南 | — | [查看](https://developer.music.163.com/st/developer/document?docId=532d1c15b92b41f89f4a114579ca2e46) |
| 获取音效列表v2 | `/openapi/music/basic/sound/effect/list/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=0150513d65d0469a89214726fba6cffa) |
| 音效鉴权-判断是否使用 | `/openapi/music/basic/sound/effect/use/check` | [查看](https://developer.music.163.com/st/developer/document?docId=9e2d5d9ef8094ff3ae5d544aef4b68cc) |
| 音效鉴权使用 | `/openapi/music/basic/sound/effect/use` | [查看](https://developer.music.163.com/st/developer/document?docId=fe8cbc15894d4898b5a0929ebf637234) |
| 权益回收校验 | `/openapi/music/basic/sound/effect/recycle` | [查看](https://developer.music.163.com/st/developer/document?docId=338a96d5aef842c4bf4b18ce9a477a04) |
| 获取音效列表（已作废） | `/openapi/music/basic/sound/effect/list` | [查看](https://developer.music.163.com/st/developer/document?docId=502fa8ce1b1b41a2a6be281c09fdef5a) |

### WPS

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| WPS token 解密 | `/openapi/music/multi/terminal/pc/wps/token/decrypt` | [查看](https://developer.music.163.com/st/developer/document?docId=a92c7afbeeca4a7b8dfff236b2cd093e) |

### 有声书批量导入

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 接入须知 | `/openapi/podcast/voicebook/import/create` | [查看](https://developer.music.163.com/st/developer/document?docId=4b2918ccbc5646e28aca64f6910450a2) |
| 创建&更新播单 | `/openapi/podcast/voicebook/import/create` | [查看](https://developer.music.163.com/st/developer/document?docId=09953fd09fce4b89992912ac1ee4bdf7) |
| 批量导入声音 | `/openapi/podcast/voicebook/import/voice/batch` | [查看](https://developer.music.163.com/st/developer/document?docId=29002a483fe8497f856ba540c12d1782) |
| 查询导入状态 | `/openapi/podcast/voicebook/import/status` | [查看](https://developer.music.163.com/st/developer/document?docId=0cdfc696f7cc4f99b8863a3cb040a241) |

### 会员API

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 供应商退款接口 | `/openapi/vippro/vipproduct/commonvip/supplier/refund` | [查看](https://developer.music.163.com/st/developer/document?docId=81f73278f2244926898b7fbec81b8276) |

### SDK相关

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 判断当前场景是否支持全曲试听 | `/openapi/music/basic/song/listen/type/get` | [查看](https://developer.music.163.com/st/developer/document?docId=aa78fdff5d1a499e9c4805bf33708d3b) |
| 获取调音配置 | `/openapi/music/basic/tuning/tools/config/fetch` | [查看](https://developer.music.163.com/st/developer/document?docId=cf4ec90104fa441d8d81e191a4ab2dbf) |

### cmcc

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 登录验证 | `/openapi/cmcc/package/login` | [查看](https://developer.music.163.com/st/developer/document?docId=497d3904277049b3a34b90438fc84853) |
| 获取分省协议接口 | `/openapi/cmcc/package/protocol` | [查看](https://developer.music.163.com/st/developer/document?docId=437bea01ab9442c891b9f7ec58733765) |
| 发送短信验证码接口 | `/openapi/cmcc/package/sms/code` | [查看](https://developer.music.163.com/st/developer/document?docId=c7903002a2b040a98a81587fa21d6081) |
| 下单接口 | `/openapi/cmcc/package/order` | [查看](https://developer.music.163.com/st/developer/document?docId=53ebdcf041234cc68ed4f137c9556c93) |

### 权益活动API

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 查询兑换码使用状态 | `/openapi/middle/interest/exchangecode/query` | [查看](https://developer.music.163.com/st/developer/document?docId=4701faa63b7542388584815c94cdd6aa) |
| 根据手机号查询用户身份 | `/openapi/middle/activity/music-moyi/query-user-status` | [查看](https://developer.music.163.com/st/developer/document?docId=dc62065cc0d9432b98e6a0db15f097fc) |
| 获取权益所需要的凭证(兑换码) | `/openapi/middle/interest/exchangecode/generate` | [查看](https://developer.music.163.com/st/developer/document?docId=d4cad52c3603413ea834111e41ace6fe) |

### AIDJ定制

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| AIDJ获取推荐歌曲 | `/openapi/music/basic/song/aidj/chat/rcmd` | [查看](https://developer.music.163.com/st/developer/document?docId=00d60deecc8d4e3480ccd43123ac9ffb) |

### 用户API

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 三方用户绑定接口 | `/openapi/activity/summary/annual/third-party/2025/user-bind` | [查看](https://developer.music.163.com/st/developer/document?docId=5892fe08931c4e7daa13f0b0bf0272d8) |
| 获取用户附近的用户列表 | `/openapi/music/basic/user/nearby/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=dd8f7dfe27be477290b1a7ef6ab54840) |
| 使用授权令牌获取用户信息 | `/openapi/music/basic/user/info/bytoken/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=a579119dae474d5e9537e723b61850cb) |
| 获取用户会员信息（仅杜比等特殊会员使用） | `/openapi/music-vip-membership/open-platform/iot/vip/info` | [查看](https://developer.music.163.com/st/developer/document?docId=c0526c10266b43ad8d98db312882d2b9) |

### 光遇限定API

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 冠名光遇治愈模式 | `/openapi/music/basic/radio/fm/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=ae23df90d0a44195827bbc11d50d2fc6) |

### 闹铃API

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 获取闹铃列表 | `/openapi/music/basic/alarm/list/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=3ffaf20b59d546aebd6fd5a87c1d0b87) |
| 获取闹铃播放地址 | `/openapi/music/basic/alarm/playurl/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=65388633436746c984426119d4c6ac5a) |

### 跳转协议API

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 获取云音乐跳转协议 | `/openapi/music/orpheus/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=7b69e518197a4921b7acd881ff69d3ed) |

### 特殊场景

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 判断歌曲是否在当前场景曲库内 | `/openapi/music/basic/song/distribute/channel/info` | [查看](https://developer.music.163.com/st/developer/document?docId=13a99482539f491d8b1aeb393b70f3ec) |

### 一起听API

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 用户登陆状态发生变化 | `/openapi/listen/together/privilege/change/report` | [查看](https://developer.music.163.com/st/developer/document?docId=f544116120d04d55902be9da803aa157) |
| 房间内发生切歌 | `/openapi/listen/together/song/change/report` | [查看](https://developer.music.163.com/st/developer/document?docId=146be9d07fa2450bba1a0e173077c66e) |
| 某人喜欢某首歌曲 | `/openapi/listen/together/like/song` | [查看](https://developer.music.163.com/st/developer/document?docId=294e563b96d74e62ad3840630a3ed94d) |
| 某次一起听结束 | `/openapi/listen/together/end` | [查看](https://developer.music.163.com/st/developer/document?docId=1aab15d9cc914151b5001c9dd339379b) |
| 获取某次一起听结算数据 | `/openapi/listen/together/relation/statistics/get` | [查看](https://developer.music.163.com/st/developer/document?docId=c1219775cf6c4e009155cd313385e37c) |
| 直接同步上报 | `/openapi/listen/together/full/report` | [查看](https://developer.music.163.com/st/developer/document?docId=e9349c0f4f0648be90b27090415c049f) |
| 创建一起听房间 | `/openapi/listen/together/room/create` | [查看](https://developer.music.163.com/st/developer/document?docId=63c6f15f17514ba0af72fc5a7cea36f6) |

### 用户关系API

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 添加关注关系 | — | [查看](https://developer.music.163.com/st/developer/document?docId=9f77a2591aa646c19403f573f1fec5e3) |
| 获取关注列表 | — | [查看](https://developer.music.163.com/st/developer/document?docId=c0864ebfee8a4e0983a49fab6e00d2db) |
| 关注关系判断 | — | [查看](https://developer.music.163.com/st/developer/document?docId=0b3904236c724eb88e17703d3a4d50c6) |

### 转售API

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 转售-批量获取歌曲信息列表 | `/openapi/music/channel/song/list/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=8a864defcbf745aaab3fe3ca3b4b3f61) |
| 转售-批量获取歌曲信息列表 | `/openapi/music/channel/song/list/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=c8f290648ca343ac8b055b8b10b7d972) |
| 转售-获取评论 | `/openapi/music/channel/comments/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=07754732d1cc44a0bcd7dd486104ab54) |
| 转售-获取热度评论 | `/openapi/music/channel/comments/hot/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=1e0714929dc94f998d102c3a678f7787) |
| 转售-获取歌词 | `/openapi/music/channel/song/lyric/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=91d17e03c20b4932b605ffd1c925f651) |
| 转售-获取歌曲详情 | `/openapi/music/channel/song/detail/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=f0cae7a2f7654be88f6904ce7509096d) |
| 转售-获取歌曲下载url | `/openapi/music/channel/song/downloadurl/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=ac5245c18a39471bba58dc9e84ff49bf) |
| 转售-获取歌单里的歌曲列表 | `/openapi/music/channel/playlist/song/list/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=2846c600449f4d6dab93f358357e28ae) |
| 转售-获取歌曲播放url | `/openapi/music/channel/song/playurl/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=cd17c04908df46e2a9a3812ed73595a1) |
| 转售-批量获取歌单列表 | `/openapi/music/channel/playlist/batch/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=eadf1b61f32841b8950d1f59dd8b4386) |

### AIO素材服务

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 素材中心开放平台接口 | `/openapi/aio/creative/material/upload` | [查看](https://developer.music.163.com/st/developer/document?docId=fb5c0f2d1c204e7388aaa09375328a5a) |

### AIO制作服务

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 查询任务执行结果 | `/openapi/aio/produce/task/result/get` | [查看](https://developer.music.163.com/st/developer/document?docId=c020806c04ce4dfabc8766e38d47f6a7) |
| 统一识谱功能 | — | [查看](https://developer.music.163.com/st/developer/document?docId=d4f11f8f998e479a831a58bd70612823) |
| 服务列表 | — | [查看](https://developer.music.163.com/st/developer/document?docId=515319de7b8d45a6a828cb47bbd205b7) |
| 创建任务 | `/openapi/aio/produce/task/create` | [查看](https://developer.music.163.com/st/developer/document?docId=c76bddd082e2403c96b8d624b477d9ba) |
| AIO制作服务接入指南 | `/api/test/openapi/workflow/callback` | [查看](https://developer.music.163.com/st/developer/document?docId=2c6ef2b5a6eb496883331769247d215a) |
| 同步执行任务 | `/openapi/aio/produce/task/sync/execute` | [查看](https://developer.music.163.com/st/developer/document?docId=cd2013e8f20a4ee9a34b00f2738fc8e4) |

### 社区故事房间

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 获取房间栏目 | `/openapi/podcast/room/columns/get` | [查看](https://developer.music.163.com/st/developer/document?docId=fb17ed64b23847168452cbb5e909fa81) |
| 获取房间播放位置 | `/openapi/podcast/room/play/location/get` | [查看](https://developer.music.163.com/st/developer/document?docId=5435a245dfe84e0cbe860936f1fc88a8) |
| 获取音频播放地址 | `/openapi/podcast/play/url/get` | [查看](https://developer.music.163.com/st/developer/document?docId=7639d71f51e0475888be4377ddf8aac3) |
| 接口限流说明 | — | [查看](https://developer.music.163.com/st/developer/document?docId=ef9b820ca10c4a3e89fd1e686560f3ba) |
| 获取往期节目 | `/openapi/podcast/previous/program/list` | [查看](https://developer.music.163.com/st/developer/document?docId=dbc7bf29f6154cf39de1233ca2811f70) |

### 游戏联运API

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 法律条款展示开关 | `/openapi/api/game/clause/switch/get` | [查看](https://developer.music.163.com/st/developer/document?docId=da3c2516c0c8455ead79a57457990c1b) |
| 心跳防沉迷接口 | `/openapi/api/game/time/heartbeat` | [查看](https://developer.music.163.com/st/developer/document?docId=3e5274ec6bfc48dc8312cb4741e057e2) |
| 进行实证二要素校验 | `/api/user/cert/twoelement/verify` | [查看](https://developer.music.163.com/st/developer/document?docId=b18892d1f75f473591507fd1d5241781) |
| 获取实证二要素状态 | `/openapi/user/cert/twoelement/status/get` | [查看](https://developer.music.163.com/st/developer/document?docId=157101ecaa994cf5b7be229190cf31f9) |
| 预下单 | `/openapi/game/distribute/ordering/web/checkout/token` | [查看](https://developer.music.163.com/st/developer/document?docId=602652dc55d44104bfce307633309521) |
| 使用预下单支付接口 | `/openapi/ordering/web/checkout/token/order` | [查看](https://developer.music.163.com/st/developer/document?docId=25a6ee0911e742649389903f98576970) |
| 获取用户信息 | `/openapi/music/basic/user/info/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=36318b8370a34db1b965b3cedc55b366) |

### 直播游戏API

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 获取游戏币余额 | `/openapi/livestream/game/balance/get` | [查看](https://developer.music.163.com/st/developer/document?docId=2938ac698de042d982f10200c6dfb7f7) |
| 获取正在直播的主播列表 | `/openapi/livestream/game/live/anchorinfo/get` | [查看](https://developer.music.163.com/st/developer/document?docId=9b4c01cb666a49ea89ce81557c8ce84c) |
| 送礼 | `/openapi/livestream/game/gift/present` | [查看](https://developer.music.163.com/st/developer/document?docId=28f1e9b7391b4d10b6ae62837e9a77b1) |
| 游戏内部消耗游戏币 | `/openapi/livestream/game/combine/submit` | [查看](https://developer.music.163.com/st/developer/document?docId=70140e917cba4779a3590d917e61f14a) |
| 获取用户信息 | `/openapi/livestream/game/user/info/get` | [查看](https://developer.music.163.com/st/developer/document?docId=3665c690594a4103b4ab45ea0e95cda1) |
| 获取礼物列表 | `/openapi/livestream/game/gift/get` | [查看](https://developer.music.163.com/st/developer/document?docId=92c87cc1eb6b476683422b5821439bd6) |

### 种花活动

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 获取粉团详细信息 | — | [查看](https://developer.music.163.com/st/developer/document?docId=6f3223a6cd23482fbdd7db7d19cc17a1) |
| 获取用户加入的粉团列表 | — | [查看](https://developer.music.163.com/st/developer/document?docId=5c68924a7aaf4535946cb3b8ce772fe4) |
| 增加积分 | — | [查看](https://developer.music.163.com/st/developer/document?docId=03bdc36861b24f029bdeec0d9d3ad2cd) |
| 加入粉团 | — | [查看](https://developer.music.163.com/st/developer/document?docId=28ef69dbfb1f4923adc8af1985317abf) |
| 种花云贝充值消费余额接口 | `/openapi/yunbei/balance` | [查看](https://developer.music.163.com/st/developer/document?docId=10093fada68646b4a6500e3e2818964f) |
| 批量查询乐迷团信息 | — | [查看](https://developer.music.163.com/st/developer/document?docId=ffa4fd720efa49dbbebe1c92aefa4769) |
| 游标分页查询粉团 | — | [查看](https://developer.music.163.com/st/developer/document?docId=d27e4683c1c94c059e170e23070e6af2) |

### 私域小程序API

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 会员中心奖励下发 | `/openapi/music/market/activity/user/vip/issue` | [查看](https://developer.music.163.com/st/developer/document?docId=a8562b1deffc45d8a9e1fced1cd61765) |
| 云音乐用户信息查询 | `/openapi/music/basic/user/oauth2/urs/login` | [查看](https://developer.music.163.com/st/developer/document?docId=3b0e841a767e444fb45f82669e5355c0) |

### 多人一起听

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 获取请求二维码 | `/openapi/music/multi/listen/room/qrcode/get` | [查看](https://developer.music.163.com/st/developer/document?docId=edc512bdc5c14df8980b57642b8fb802) |
| 获取房间内用户信息 | `/openapi/music/multi/listen/room/user/list` | [查看](https://developer.music.163.com/st/developer/document?docId=7b49fb0800794771bdc085ff7e4b7946) |

### MV API

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 获取mv信息 | `/openapi/music/basic/mv/detail/get/v2` | [查看](https://developer.music.163.com/st/developer/document?docId=b99f6a68d23b4864afd80b15bf523d5c) |


## SDK文档

### 概述

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 常见问题 | — | [查看](https://developer.music.163.com/st/developer/document?docId=108e65bc5af7436ba307b8a93a22b7d2) |
| SDK介绍 | — | [查看](https://developer.music.163.com/st/developer/document?docId=893c051f4593429f9266af9fadba828b) |
| ChangeLog | — | [查看](https://developer.music.163.com/st/developer/document?docId=8cda9dcb4a8449e29ebadf315362f0c2) |

### 快速开始

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 注意事项 | — | [查看](https://developer.music.163.com/st/developer/document?docId=5e239af0644244c586fbb166a9226bcc) |
| 错误码 | — | [查看](https://developer.music.163.com/st/developer/document?docId=a2812cd2e9754282ba329453ed1b2201) |
| 快速开始 | — | [查看](https://developer.music.163.com/st/developer/document?docId=9f2f7f65197a42b7849bff35f85fb6a5) |

### 详细功能

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| API错误码 | — | [查看](https://developer.music.163.com/st/developer/document?docId=a7f4a79bd845490db103b223db20805a) |
| 登录相关 | — | [查看](https://developer.music.163.com/st/developer/document?docId=95fc73f9d53b4500b8757a1daebb03a4) |
| 主页 | — | [查看](https://developer.music.163.com/st/developer/document?docId=859ed5419776499e9444c293a4f2b3a9) |
| 评论 | — | [查看](https://developer.music.163.com/st/developer/document?docId=316674cf38ad438ca624d7730a4d3150) |
| HiFi专区 | — | [查看](https://developer.music.163.com/st/developer/document?docId=2bdf9d1423734c899c7d2c57d02a5315) |
| 其他工具 | — | [查看](https://developer.music.163.com/st/developer/document?docId=d9c27fcc2e9d4c4482a78e53f5adddee) |
| 会员收银台 | `/prime/m/iot-cashier` | [查看](https://developer.music.163.com/st/developer/document?docId=5ca3f751d15542609b6af6d6cb09ee18) |
| 专辑 | — | [查看](https://developer.music.163.com/st/developer/document?docId=8fbd06b5f06e44ef9b464b273148f98b) |
| 播单 | — | [查看](https://developer.music.163.com/st/developer/document?docId=e658ce9a7c104391b8fd82483d8b7f99) |
| 杜比专区 | — | [查看](https://developer.music.163.com/st/developer/document?docId=c6e63976cd3a477faad4aad18add102c) |
| 艺人 | — | [查看](https://developer.music.163.com/st/developer/document?docId=8a14c832f0834638a23f1b43202b72c6) |
| 搜索 | — | [查看](https://developer.music.163.com/st/developer/document?docId=68223c4d04b34b19a7320877e6013cec) |
| 歌单 | — | [查看](https://developer.music.163.com/st/developer/document?docId=2e8fa1adc9b64548b70372f7f2d30d73) |
| 音质&音效 | — | [查看](https://developer.music.163.com/st/developer/document?docId=db45868f1ace42fe97c8384fab51de62) |
| 播放器 | — | [查看](https://developer.music.163.com/st/developer/document?docId=49f5a41f9ec64207ba78d91e96119d59) |
| 推荐 | — | [查看](https://developer.music.163.com/st/developer/document?docId=3ac5fe6738ef4b82a806118c88950ad7) |
| 随心唱(无麦K歌) | — | [查看](https://developer.music.163.com/st/developer/document?docId=36996d01bc364d82902735eb76e5e0bb) |
| 副歌模式 | — | [查看](https://developer.music.163.com/st/developer/document?docId=6dc9c4bec00643fdb9343a0faba8e3eb) |

### 数据结构

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 数据结构 | — | [查看](https://developer.music.163.com/st/developer/document?docId=6a5955577c0c43e3a8ae1100093d6f04) |


## CMAPI文档

### 接入指南

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 接入指南 | — | [查看](https://developer.music.163.com/st/developer/document?docId=1ff38acee11c4b74b71336100245e73c) |

### CMAPI申请

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| APP ID申请 | — | [查看](https://developer.music.163.com/st/developer/document?docId=c787de94c6c14f3da3351b03135302f1) |
| 生成秘钥对 | — | [查看](https://developer.music.163.com/st/developer/document?docId=5f9eb2f897e543e5b14b1c41d54d9057) |
| demo示例 | — | [查看](https://developer.music.163.com/st/developer/document?docId=4bd6df81fc354e5297a883b09f2ccee0) |
| 秘钥使用 | — | [查看](https://developer.music.163.com/st/developer/document?docId=ca062676734c46289ddfda348fc4b0fd) |

### CMAPI接口文档

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 简介 | — | [查看](https://developer.music.163.com/st/developer/document?docId=0bc2ccadd2264e41a5b3ca1acf29064d) |
| API调用 | — | [查看](https://developer.music.163.com/st/developer/document?docId=ef167ee729c14f69b37389b1d2e5a05d) |
| 接口参数 | — | [查看](https://developer.music.163.com/st/developer/document?docId=3fadf631d7fb4c98a4be386bdcb5c6cd) |
| 具体命令 | — | [查看](https://developer.music.163.com/st/developer/document?docId=f185ae5703af4072a9b3884dbf2804f2) |
| 监听状态 | — | [查看](https://developer.music.163.com/st/developer/document?docId=d2e096496b824c6f8b678c72e6d5faff) |


## 网易云音认证

### 介绍

| 接口名称 | 路径 | 原始文档 |
|---|---|---|
| 网易云音认证简介 | — | [查看](https://developer.music.163.com/st/developer/document?docId=f9c773ca761e43eeb23c82d3ac0a2d08) |

