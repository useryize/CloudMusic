import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { searchSongs, searchEntities, searchTypes } from '../api/search'
import type { SearchType } from '../api/search'
import type { Entity, Track, ListPage } from '../api/types'
import {
  authStatus,
  likedPlaylist,
  localApi,
  recentSongs,
  savedPlaylists,
  userProfile,
} from '../api/user'
import { getPlaylistTracks } from '../api/playlist'
import {
  EntityGrid,
  Empty,
  PlayAll,
  QueryState,
  SongTable,
} from '../components/Music'
import { queryClient } from '../lib/queryClient'
import { player } from '../player/engine'

const types = Object.keys(searchTypes) as SearchType[]
async function searchContent(
  type: SearchType,
  keyword: string,
  offset = 0,
): Promise<ListPage<Entity | Track>> {
  return type === 'song'
    ? searchSongs(keyword, offset)
    : searchEntities(type, keyword, offset)
}
function SearchResults({
  type,
  keyword,
}: {
  type: SearchType
  keyword: string
}) {
  const query = useInfiniteQuery({
    queryKey: ['search', type, keyword],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => searchContent(type, keyword, pageParam),
    staleTime: 60000,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((n, p) => n + p.items.length, 0)
      return last.more && (last.total === undefined || loaded < last.total)
        ? loaded
        : undefined
    },
  })
  const items = query.data?.pages.flatMap((p) => p.items) ?? []
  return (
    <>
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      />
      {query.data &&
        (type === 'song' ? (
          <SongTable
            tracks={items as Track[]}
            rowHeight={52}
            sourceType="search"
            hasMore={query.hasNextPage}
            fetching={query.isFetchingNextPage}
            loadMore={() => void query.fetchNextPage()}
          />
        ) : (
          <>
            <EntityGrid items={items as Entity[]} kind={type} />
            {query.hasNextPage && (
              <button
                className="load-more"
                disabled={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                加载更多
              </button>
            )}
          </>
        ))}
      {query.isFetchNextPageError && (
        <p role="alert">加载下一页失败，请重试。</p>
      )}
    </>
  )
}
function CombinedSearch({ keyword }: { keyword: string }) {
  const query = useQuery({
    queryKey: ['search', 'all', keyword],
    staleTime: 60000,
    queryFn: async () =>
      Promise.allSettled(types.map((type) => searchContent(type, keyword))),
  })
  return (
    <>
      <QueryState pending={query.isPending} error={query.error} />
      {query.data?.map((result, i) => (
        <section className="music-section" key={types[i]}>
          <div className="section-heading">
            <h2>{searchTypes[types[i]]}</h2>
            <Link
              to={`/search?q=${encodeURIComponent(keyword)}&type=${types[i]}`}
            >
              更多 ›
            </Link>
          </div>
          {result.status === 'rejected' ? (
            <p role="status">此分类暂时加载失败，可进入分类重试。</p>
          ) : types[i] === 'song' ? (
            <SongTable
              tracks={(result.value.items as Track[]).slice(0, 5)}
              rowHeight={52}
              sourceType="search"
            />
          ) : (
            <EntityGrid
              items={(result.value.items as Entity[]).slice(0, 5)}
              kind={types[i] as Exclude<SearchType, 'song'>}
            />
          )}
        </section>
      ))}
    </>
  )
}
export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const keyword = params.get('q')?.trim() ?? ''
  const selected = params.get('type') ?? 'all'
  return (
    <>
      <h1>搜索结果</h1>
      <p className="muted">
        {keyword ? `“${keyword}”` : '在顶栏输入关键词，发现喜欢的音乐'}
      </p>
      <nav className="tabs" aria-label="搜索分类">
        {[['all', '综合'], ...Object.entries(searchTypes)].map(
          ([key, label]) => (
            <button
              key={key}
              aria-current={selected === key ? 'page' : undefined}
              onClick={() => setParams({ q: keyword, type: key })}
            >
              {label}
            </button>
          ),
        )}
      </nav>
      {!keyword ? (
        <Empty text="输入关键词开始搜索" />
      ) : selected === 'all' ? (
        <CombinedSearch key={keyword} keyword={keyword} />
      ) : types.includes(selected as SearchType) ? (
        <SearchResults
          key={`${keyword}:${selected}`}
          keyword={keyword}
          type={selected as SearchType}
        />
      ) : (
        <Empty text="请选择搜索分类" />
      )}
    </>
  )
}
export function MinePage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'recent'
  const status = useQuery({ queryKey: ['auth'], queryFn: authStatus })
  const enabled = !!status.data?.loggedIn
  const profile = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: userProfile,
    enabled,
  })
  const star = useQuery({
    queryKey: ['user', 'star'],
    queryFn: likedPlaylist,
    enabled: enabled && tab === 'liked',
  })
  const liked = useInfiniteQuery({
    queryKey: ['user', 'liked', star.data?.id],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getPlaylistTracks(star.data!.id, pageParam),
    enabled: enabled && tab === 'liked' && !!star.data?.id,
    getNextPageParam: (last, all) =>
      last.more ? all.reduce((n, p) => n + p.items.length, 0) : undefined,
  })
  const recent = useQuery({
    queryKey: ['user', 'recent'],
    queryFn: recentSongs,
    enabled: enabled && tab === 'recent',
  })
  const saved = useInfiniteQuery({
    queryKey: ['user', 'saved'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => savedPlaylists(pageParam),
    enabled: enabled && tab === 'saved',
    getNextPageParam: (last, all) =>
      last.more ? all.reduce((n, p) => n + p.items.length, 0) : undefined,
  })
  const logout = useMutation({
    mutationFn: () => localApi('/api/auth/logout', {}),
    onSuccess: () => {
      player.stop()
      queryClient.clear()
      void queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
  if (!enabled)
    return (
      <>
        <h1>我的音乐</h1>
        <QueryState pending={status.isPending} error={status.error} />
        {status.data && (
          <div className="empty">
            <p>登录后，收藏与最近播放会在这里与你相见。</p>
            <Link className="primary" to="/login?next=/mine">
              登录云音乐
            </Link>
          </div>
        )}
      </>
    )
  const tracks =
    tab === 'liked'
      ? (liked.data?.pages.flatMap((p) => p.items) ?? [])
      : (recent.data?.items ?? [])
  return (
    <>
      <div className="user-hero">
        <div className="avatar">
          {profile.data?.avatarUrl ? (
            <img src={profile.data.avatarUrl} alt="" />
          ) : (
            profile.data?.nickname?.slice(0, 1)
          )}
        </div>
        <div>
          <h1>{profile.data?.nickname || '我的音乐'}</h1>
          <p className="muted">
            {profile.data?.signature || '让喜欢的音乐，成为日常。'}
          </p>
        </div>
        <button
          className="secondary"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          退出登录
        </button>
      </div>
      <QueryState error={profile.error || logout.error} />
      <nav className="tabs" aria-label="我的音乐分类">
        {[
          ['recent', '最近播放'],
          ['liked', '我喜欢的音乐'],
          ['saved', '收藏歌单'],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-current={tab === key ? 'page' : undefined}
            onClick={() => setParams({ tab: key })}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === 'saved' ? (
        <>
          <QueryState pending={saved.isPending} error={saved.error} />
          {saved.data && (
            <EntityGrid items={saved.data.pages.flatMap((p) => p.items)} />
          )}{' '}
          {saved.hasNextPage && (
            <button
              className="load-more"
              disabled={saved.isFetchingNextPage}
              onClick={() => void saved.fetchNextPage()}
            >
              加载更多歌单
            </button>
          )}
        </>
      ) : (
        <>
          <PlayAll tracks={tracks} />
          <QueryState
            pending={
              tab === 'liked'
                ? star.isPending || liked.isPending
                : recent.isPending
            }
            error={tab === 'liked' ? star.error || liked.error : recent.error}
          />
          {(tab === 'liked' ? liked.data : recent.data) && (
            <SongTable
              tracks={tracks}
              rowHeight={48}
              sourceId={star.data?.id}
              hasMore={tab === 'liked' && liked.hasNextPage}
              fetching={liked.isFetchingNextPage}
              loadMore={() => void liked.fetchNextPage()}
            />
          )}
        </>
      )}
    </>
  )
}
export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [remaining, setRemaining] = useState(0)
  const qr = useMutation({
    mutationFn: () =>
      localApi<{ key: string; qrUrl: string; expiresIn: number }>(
        '/api/auth/qrcode',
        {},
      ),
    onSuccess: (data) => setRemaining(data.expiresIn),
  })
  const poll = useQuery({
    queryKey: ['auth', 'poll', qr.data?.key],
    queryFn: () =>
      localApi<{ status: number; msg: string }>(
        `/api/auth/poll?key=${encodeURIComponent(qr.data!.key)}`,
      ),
    enabled: !!qr.data && remaining > 0,
    refetchInterval: (query) =>
      [800, 803, 804].includes(query.state.data?.status ?? 0) ? false : 2000,
    retry: false,
  })
  useEffect(() => {
    if (!qr.data) return
    const end = Date.now() + qr.data.expiresIn * 1000
    const timer = setInterval(
      () => setRemaining(Math.max(0, Math.ceil((end - Date.now()) / 1000))),
      1000,
    )
    return () => clearInterval(timer)
  }, [qr.data])
  useEffect(() => {
    if (poll.data?.status === 803) {
      queryClient.clear()
      const next = params.get('next')
      void navigate(
        next?.startsWith('/') && !next.startsWith('//') ? next : '/',
      )
    }
  }, [poll.data?.status, navigate, params])
  const anonymous = useMutation({
    mutationFn: () => localApi('/api/auth/anonymous', {}),
    onSuccess: () => {
      queryClient.clear()
      void navigate('/')
    },
  })
  const expired = remaining === 0 || poll.data?.status === 800
  return (
    <main className="standalone">
      <div className="login">
        <p className="eyebrow">云音乐</p>
        <h1>听见你的世界</h1>
        <p className="muted">使用网易云音乐 App 扫码登录</p>
        <div className="qr-box">
          {qr.data && !expired ? (
            <QRCodeSVG
              value={qr.data.qrUrl}
              size={180}
              marginSize={2}
              title="网易云音乐登录二维码"
            />
          ) : (
            <button
              className="primary"
              disabled={qr.isPending}
              onClick={() => qr.mutate()}
            >
              {qr.isPending
                ? '生成中…'
                : qr.data
                  ? '刷新二维码'
                  : '生成登录二维码'}
            </button>
          )}
        </div>
        <p role="status">
          {expired && qr.data
            ? '二维码已过期，请刷新'
            : poll.data?.msg ||
              (qr.data
                ? `二维码 ${remaining} 秒后失效`
                : '点击生成二维码开始登录')}
        </p>
        <QueryState error={qr.error || poll.error || anonymous.error} />
        {poll.error && (
          <button className="secondary" onClick={() => void poll.refetch()}>
            重试扫码状态
          </button>
        )}
        <button
          className="secondary"
          disabled={anonymous.isPending}
          onClick={() => anonymous.mutate()}
        >
          匿名体验
        </button>
        <p className="muted">匿名模式下部分收藏与会员内容不可用。</p>
        <Link to="/">返回发现音乐 →</Link>
        <p>
          <Link to="/setup">应用配置</Link>
        </p>
      </div>
    </main>
  )
}
