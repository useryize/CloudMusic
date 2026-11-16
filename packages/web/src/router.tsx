import { createBrowserRouter } from 'react-router'
import { AppShell } from './components/layout/AppShell'
const scaffold = (title: string, description: string) => async () => {
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
          Component: (await import('./pages/Browse')).DiscoverPage,
        }),
      },
      {
        path: 'playlist/:id',
        lazy: async () => ({
          Component: (await import('./pages/Browse')).PlaylistPage,
        }),
      },
      {
        path: 'album/:id',
        lazy: async () => ({
          Component: (await import('./pages/Browse')).AlbumPage,
        }),
      },
      {
        path: 'artist/:id',
        lazy: async () => ({
          Component: (await import('./pages/Browse')).ArtistPage,
        }),
      },
      {
        path: 'toplist',
        lazy: async () => ({
          Component: (await import('./pages/Browse')).ToplistPage,
        }),
      },
      {
        path: 'daily',
        lazy: async () => ({
          Component: (await import('./pages/Browse')).DailyPage,
        }),
      },
      {
        path: 'square',
        lazy: async () => ({
          Component: (await import('./pages/Browse')).SquarePage,
        }),
      },
      {
        path: 'search',
        lazy: async () => ({
          Component: (await import('./pages/Library')).SearchPage,
        }),
      },
      {
        path: 'mine',
        lazy: async () => ({
          Component: (await import('./pages/Library')).MinePage,
        }),
      },
      {
        path: 'comment/:songId',
        lazy: async () => ({
          Component: (await import('./pages/Comments')).CommentPage,
        }),
      },
      {
        path: 'setup',
        lazy: async () => ({
          Component: (await import('./pages/Pages')).SetupPage,
        }),
      },
      { path: 'podcast', lazy: scaffold('播客频道', '听见更多有趣的声音') },
      { path: 'video', lazy: scaffold('视频', '发现音乐里的故事') },
      { path: 'together/:roomId', lazy: scaffold('一起听', '让音乐连接彼此') },
      { path: '*', lazy: scaffold('页面未找到', '请通过左侧导航继续浏览') },
    ],
  },
  {
    path: '/login',
    lazy: async () => ({
      Component: (await import('./pages/Library')).LoginPage,
    }),
  },
  {
    path: '/now-playing',
    lazy: async () => ({
      Component: (await import('./pages/NowPlaying')).NowPlayingPage,
    }),
  },
])
