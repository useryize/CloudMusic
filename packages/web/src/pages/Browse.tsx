import { Link, useParams } from 'react-router'
import { useQuery, useInfiniteQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import * as catalog from '../api/catalog'
import {
  getPlaylistDetail,
  getPlaylistTracks,
  subscribePlaylist,
} from '../api/playlist'
import {
  Cover,
  EntityGrid,
  PlayAll,
  QueryState,
  SongTable,
} from '../components/Music'
import { count } from '../lib/format'
import { queryClient } from '../lib/queryClient'
import { useNotice } from '../lib/ui'
import { getHotKeywords } from '../api/search'
import { Result } from './Pages'
import { useConnection } from '../api/connection'
import { authStatus } from '../api/user'

export function DiscoverPage() {
  const connection = useConnection()
  const cli = connection.data?.backend === 'cli'
  const cover = useQuery({
    queryKey: ['daily', 'cover'],
    queryFn: catalog.dailyCover,
    staleTime: 600000,
    enabled: !connection.isPending && !cli,
  })
  const playlists = useQuery({
    queryKey: ['recommend', 'playlist'],
    queryFn: () => catalog.recommendedPlaylists(),
    staleTime: 600000,
  })
  const songs = useQuery({
    queryKey: cli
      ? ['daily', new Date().toLocaleDateString('sv-SE')]
      : ['song', 'new'],
    queryFn: cli ? catalog.dailySongs : catalog.newSongs,
    staleTime: 600000,
    enabled: !connection.isPending,
  })
  const test = useQuery({
    queryKey: ['connection', 'test', cli],
    queryFn: cli ? authStatus : getHotKeywords,
    enabled: false,
  })
  return (
    <>
      <div className="page-heading">
        <h1>发现音乐</h1>
        <Link to="/setup">应用配置</Link>
      </div>
      <nav className="tabs" aria-label="发现分类">
        <span aria-current="page">个性推荐</span>
        <Link to="/square">歌单</Link>
        {!cli && <Link to="/toplist">排行榜</Link>}
      </nav>
      <div className="daily-banner">
        <div>
          <span className="eyebrow">每日推荐</span>
          <h2>今天，想听点什么</h2>
          <p>{cover.data?.name || '让音乐陪伴每一个当下'}</p>
          <Link className="pill" to="/daily">
            查看每日推荐 →
          </Link>
        </div>
        <Cover
          src={cli ? songs.data?.items[0]?.coverImgUrl : cover.data?.imgUrl}
          name="每日推荐"
        />
      </div>
      <section>
        <div className="section-heading">
          <h2>{cli ? '雷达歌单' : '推荐歌单'}</h2>
          <Link to="/square">更多 ›</Link>
        </div>
        <QueryState
          pending={playlists.isPending}
          error={playlists.error}
          retry={() => void playlists.refetch()}
        />
        {playlists.data && (
          <EntityGrid items={playlists.data.items.slice(0, 5)} />
        )}
      </section>
      <section className="music-section">
        <h2>{cli ? '为你推荐' : '最新音乐'}</h2>
        <QueryState
          pending={songs.isPending}
          error={songs.error}
          retry={() => void songs.refetch()}
        />
        {songs.data && (
          <SongTable tracks={songs.data.items} sourceType="song" />
        )}
      </section>
      <details className="debug-test">
        <summary>接口连接测试</summary>
        <button
          className="secondary"
          disabled={test.isFetching}
          onClick={() => void test.refetch()}
        >
          {cli ? '检查官方 CLI 登录状态' : '测试热搜请求'}
        </button>
        <Result data={test.data} error={test.error} pending={test.isFetching} />
      </details>
    </>
  )
}
export function PlaylistPage() {
  const cli = useConnection().data?.backend === 'cli'
  const { id = '' } = useParams()
  const detail = useQuery({
    queryKey: ['playlist', id, 'detail'],
    queryFn: () => getPlaylistDetail(id),
    enabled: !!id,
  })
  const songs = useInfiniteQuery({
    queryKey: ['playlist', id, 'tracks'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getPlaylistTracks(id, pageParam),
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((n, p) => n + p.items.length, 0)
      return last.more && (last.total === undefined || loaded < last.total)
        ? loaded
        : undefined
    },
  })
  const subscribe = useMutation({
    mutationFn: () => subscribePlaylist(id, !!detail.data?.subed),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['playlist', id, 'detail'],
      })
      void queryClient.invalidateQueries({ queryKey: ['user', 'saved'] })
    },
    onError: (e) => useNotice.getState().show(e.message),
  })
  const tracks = songs.data?.pages.flatMap((p) => p.items) ?? []
  return (
    <>
      <QueryState
        pending={detail.isPending}
        error={detail.error}
        retry={() => void detail.refetch()}
      />
      {detail.data && (
        <>
          <div className="detail-hero">
            <Cover src={detail.data.coverImgUrl} name={detail.data.name} />
            <div>
              <span className="badge">歌单</span>
              <h1>{detail.data.name}</h1>
              <p>{detail.data.creatorNickName}</p>
              <p className="muted">
                {detail.data.trackCount} 首 · {count(detail.data.playCount)}{' '}
                次播放
              </p>
              <div className="actions">
                <PlayAll tracks={tracks} sourceId={id} />
                {!cli && (
                  <button
                    className="secondary"
                    disabled={subscribe.isPending}
                    onClick={() => subscribe.mutate()}
                  >
                    {detail.data.subed ? '取消收藏' : '收藏'}
                  </button>
                )}
              </div>
            </div>
          </div>
          {detail.data.describe && (
            <p className="description">{detail.data.describe}</p>
          )}
        </>
      )}
      <QueryState
        pending={songs.isPending}
        error={songs.error}
        retry={() => void songs.refetch()}
      />
      {songs.data && (
        <SongTable
          tracks={tracks}
          sourceId={id}
          hasMore={songs.hasNextPage}
          fetching={songs.isFetchingNextPage}
          loadMore={() => void songs.fetchNextPage()}
        />
      )}
    </>
  )
}
export function AlbumPage() {
  const cli = useConnection().data?.backend === 'cli'
  const { id = '' } = useParams()
  const detail = useQuery({
    queryKey: ['album', id, 'detail'],
    queryFn: () => catalog.albumDetail(id),
    staleTime: 600000,
  })
  const songs = useInfiniteQuery({
    queryKey: ['album', id, 'tracks'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => catalog.albumSongs(id, pageParam),
    getNextPageParam: (last, all) =>
      last.more ? all.reduce((n, p) => n + p.items.length, 0) : undefined,
  })
  const subscribe = useMutation({
    mutationFn: () => catalog.subscribeAlbum(id, !!detail.data?.subed),
    onSuccess: () => void detail.refetch(),
    onError: (e) => useNotice.getState().show(e.message),
  })
  const tracks = songs.data?.pages.flatMap((p) => p.items) ?? []
  return (
    <>
      <QueryState pending={detail.isPending} error={detail.error} />
      {detail.data && (
        <>
          <div className="detail-hero">
            <Cover src={detail.data.coverImgUrl} name={detail.data.name} />
            <div>
              <span className="badge">专辑</span>
              <h1>{detail.data.name}</h1>
              <p>
                {detail.data.artists?.map((a) => (
                  <Link key={a.id} to={`/artist/${a.id}`}>
                    {a.name}{' '}
                  </Link>
                ))}
              </p>
              <div className="actions">
                <PlayAll tracks={tracks} sourceId={id} sourceType="album" />
                {!cli && (
                  <button
                    className="secondary"
                    disabled={subscribe.isPending}
                    onClick={() => subscribe.mutate()}
                  >
                    {detail.data.subed ? '取消收藏' : '收藏专辑'}
                  </button>
                )}
              </div>
            </div>
          </div>
          <details className="description">
            <summary>专辑介绍</summary>
            {detail.data.description || detail.data.briefDesc || '暂无介绍'}
          </details>
        </>
      )}
      <QueryState pending={songs.isPending} error={songs.error} />
      {songs.data && (
        <SongTable
          tracks={tracks}
          rowHeight={48}
          sourceId={id}
          sourceType="album"
          hasMore={songs.hasNextPage}
          fetching={songs.isFetchingNextPage}
          loadMore={() => void songs.fetchNextPage()}
        />
      )}
    </>
  )
}
export function ArtistPage() {
  const cli = useConnection().data?.backend === 'cli'
  const { id = '' } = useParams()
  const [tab, setTab] = useState('songs')
  const detail = useQuery({
    queryKey: ['artist', id],
    queryFn: () => catalog.artistDetail(id),
    staleTime: 600000,
  })
  const songs = useInfiniteQuery({
    queryKey: ['artist', id, 'tracks'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => catalog.artistSongs(id, pageParam),
    getNextPageParam: (last, all) =>
      last.more ? all.reduce((n, p) => n + p.items.length, 0) : undefined,
    enabled: tab === 'songs',
  })
  const albums = useInfiniteQuery({
    queryKey: ['artist', id, 'albums'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => catalog.artistAlbums(id, pageParam),
    getNextPageParam: (last, all) =>
      last.more ? all.reduce((n, p) => n + p.items.length, 0) : undefined,
    enabled: tab === 'albums',
  })
  const tracks = songs.data?.pages.flatMap((p) => p.items) ?? []
  return (
    <>
      <QueryState pending={detail.isPending} error={detail.error} />
      {detail.data && (
        <div className="detail-hero artist-hero">
          <Cover src={detail.data.coverImgUrl} name={detail.data.name} />
          <div>
            <span className="eyebrow">ARTIST</span>
            <h1>{detail.data.name}</h1>
            <p className="description">{detail.data.briefDesc}</p>
            <PlayAll tracks={tracks} sourceId={id} sourceType="artist" />
          </div>
        </div>
      )}
      <div className="tabs" role="tablist" aria-label="艺人内容">
        {[
          ['songs', cli ? '歌曲' : '热门歌曲'],
          ...(!cli ? [['albums', '专辑']] : []),
        ].map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'songs' ? (
        <>
          <QueryState pending={songs.isPending} error={songs.error} />
          {songs.data && (
            <SongTable
              tracks={tracks}
              rowHeight={48}
              sourceId={id}
              sourceType="artist"
              hasMore={songs.hasNextPage}
              fetching={songs.isFetchingNextPage}
              loadMore={() => void songs.fetchNextPage()}
            />
          )}
        </>
      ) : (
        <>
          <QueryState pending={albums.isPending} error={albums.error} />
          {albums.data && (
            <EntityGrid
              items={albums.data.pages.flatMap((p) => p.items)}
              kind="album"
            />
          )}
          {albums.hasNextPage && (
            <button
              className="load-more"
              disabled={albums.isFetchingNextPage}
              onClick={() => void albums.fetchNextPage()}
            >
              加载更多专辑
            </button>
          )}
        </>
      )}
    </>
  )
}
export function ToplistPage() {
  const connection = useConnection()
  const cli = connection.data?.backend === 'cli'
  const query = useQuery({
    queryKey: ['toplist'],
    queryFn: catalog.toplists,
    staleTime: 600000,
    enabled: !connection.isPending && !cli,
  })
  return (
    <>
      <h1>排行榜</h1>
      {cli && (
        <p className="muted">
          当前官方 CLI 暂未提供排行榜，请通过搜索或每日推荐发现音乐。
        </p>
      )}
      <p className="muted">听见此刻，发现热门音乐</p>
      <QueryState
        pending={query.isPending && !cli}
        error={query.error}
        retry={() => void query.refetch()}
      />
      {query.data && <EntityGrid items={query.data.items} />}
    </>
  )
}
export function DailyPage() {
  const query = useQuery({
    queryKey: ['daily', new Date().toLocaleDateString('sv-SE')],
    queryFn: catalog.dailySongs,
    staleTime: new Date().setHours(24, 0, 0, 0) - Date.now(),
  })
  const tracks = query.data?.items ?? []
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString('zh-CN')}</p>
          <h1>每日推荐</h1>
        </div>
        <PlayAll tracks={tracks} sourceType="song" />
      </div>
      <p className="description">根据你的听歌喜好，为今天挑选。</p>
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      />
      {query.data && <SongTable tracks={tracks} sourceType="song" />}
    </>
  )
}
export function SquarePage() {
  const query = useInfiniteQuery({
    queryKey: ['recommend', 'square'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => catalog.recommendedPlaylists(pageParam),
    getNextPageParam: (last, all) =>
      last.more ? all.reduce((n, p) => n + p.items.length, 0) : undefined,
  })
  return (
    <>
      <h1>推荐歌单</h1>
      <QueryState pending={query.isPending} error={query.error} />
      {query.data && (
        <EntityGrid items={query.data.pages.flatMap((p) => p.items)} />
      )}{' '}
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
  )
}
