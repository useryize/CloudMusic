import { createBrowserRouter } from 'react-router'
import { AppShell } from './components/layout/AppShell'
const page = (title: string, description: string) => async () => {
  const { ScaffoldPage } = await import('./pages/Pages')
  return {
    Component: () => <ScaffoldPage title={title} description={description} />,
  }
}
export const router = createBrowserRouter([
  {
    Component: AppShell,
    children: [
      {
        index: true,
        lazy: async () => ({
          Component: (await import('./pages/Pages')).DiscoverPage,
        }),
      },
      {
        path: 'playlist/:id',
        lazy: async () => ({
          Component: (await import('./pages/Pages')).PlaylistPage,
        }),
      },
      {
        path: 'setup',
        lazy: async () => ({
          Component: (await import('./pages/Pages')).SetupPage,
        }),
      },
      ...[
        ['search', '搜索结果', '搜索单曲、歌单、专辑与艺人'],
        ['mine', '我的音乐', '你的收藏与最近播放'],
        ['artist/:id', '艺人详情', '热门歌曲与专辑'],
        ['album/:id', '专辑详情', '专辑介绍与歌曲'],
        ['podcast', '播客频道', '听见更多有趣的声音'],
        ['toplist', '排行榜', '发现热门音乐'],
        ['video', '视频', 'MV 内容将通过官方外链打开'],
        ['comment/:songId', '评论', '分享音乐带来的感受'],
        ['square', '歌单广场', '发现适合此刻的歌单'],
        ['daily', '每日推荐', '每日为你更新'],
        ['together/:roomId', '一起听', '让音乐连接彼此'],
      ].map(([path, title, description]) => ({
        path,
        lazy: page(title, description),
      })),
      { path: '*', lazy: page('页面未找到', '请通过左侧导航继续浏览') },
    ],
  },
  {
    path: '/login',
    lazy: async () => ({
      Component: () => (
        <main className="standalone">
          <ScaffoldLogin />
        </main>
      ),
    }),
  },
  { path: '/now-playing', lazy: page('正在播放', '播放内核将在 M2 阶段接入') },
])
function ScaffoldLogin() {
  return (
    <div className="login">
      <h1>欢迎来到云音乐</h1>
      <p className="muted">扫码登录将在后续阶段接入。</p>
      <LinkBack />
    </div>
  )
}
function LinkBack() {
  return <a href="/">返回发现音乐 →</a>
}
