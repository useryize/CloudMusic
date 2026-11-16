import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useMutation } from '@tanstack/react-query'
import { Disc3, Heart, Play, MessageCircle } from 'lucide-react'
import type { Entity, Track } from '../api/types'
import { ApiError, SetupRequiredError } from '../lib/request'
import { duration, count } from '../lib/format'
import { useNotice } from '../lib/ui'
import { queryClient } from '../lib/queryClient'
import { likeSong } from '../api/user'
import { player } from '../player/engine'
import { usePlayerPreferences } from '../player/store'

export function QueryState({
  pending,
  error,
  retry,
}: {
  pending?: boolean
  error?: Error | null
  retry?: () => void
}) {
  if (pending)
    return (
      <div className="loading" role="status" aria-label="正在加载">
        <div />
        <div />
        <div />
      </div>
    )
  if (!error) return null
  const login =
    error instanceof ApiError && [401, 1406, 1408].includes(error.code)
  return (
    <div role="alert" className="empty">
      <p>{error.message}</p>
      {error instanceof SetupRequiredError ? (
        <Link to="/setup">配置应用凭证 →</Link>
      ) : login ? (
        <Link to="/login">登录后继续 →</Link>
      ) : (
        retry && (
          <button className="secondary" onClick={retry}>
            重新加载
          </button>
        )
      )}
    </div>
  )
}
export function Empty({ text = '这里还没有内容' }: { text?: string }) {
  return (
    <div className="empty">
      <Disc3 size={36} strokeWidth={1} />
      <p>{text}</p>
    </div>
  )
}
export function Cover({
  src,
  name,
  className = '',
}: {
  src?: string
  name: string
  className?: string
}) {
  return (
    <div className={`music-cover ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.visibility = 'hidden'
          }}
        />
      ) : (
        <Disc3 aria-hidden size={36} />
      )}
    </div>
  )
}
export function EntityGrid({
  items,
  kind = 'playlist',
}: {
  items: Entity[]
  kind?: 'playlist' | 'album' | 'artist' | 'mv' | 'podcast'
}) {
  if (!items.length) return <Empty />
  return (
    <div className={`music-grid ${kind === 'artist' ? 'artists' : ''}`}>
      {items.map((item) => {
        const content = (
          <>
            <Cover src={item.coverImgUrl} name={item.name} />
            <h3>{item.name}</h3>
            <p>
              {item.creatorNickName ||
                item.artists?.map((a) => a.name).join(' / ') ||
                (item.playCount
                  ? `${count(item.playCount)} 次播放`
                  : item.describe)}
            </p>
          </>
        )
        return kind === 'mv' || kind === 'podcast' ? (
          <a
            key={item.id}
            className="music-card"
            target="_blank"
            rel="noreferrer"
            href={`https://music.163.com/#/search/m/?s=${encodeURIComponent(item.name)}&type=${kind === 'mv' ? '1004' : '1009'}`}
          >
            {content}
            <small>在网易云音乐打开 ↗</small>
          </a>
        ) : (
          <Link
            key={item.id}
            className="music-card"
            to={`/${kind}/${encodeURIComponent(item.id)}`}
          >
            {content}
          </Link>
        )
      })}
    </div>
  )
}
export function LikeButton({ track }: { track: Track }) {
  const mutation = useMutation({
    mutationFn: () => likeSong(track.id, !track.liked),
    onSuccess: () => {
      useNotice.getState().show(track.liked ? '已取消喜欢' : '已添加到喜欢')
      void queryClient.invalidateQueries()
      const state = usePlayerPreferences.getState()
      usePlayerPreferences.setState({
        queue: state.queue.map((t) =>
          t.id === track.id ? { ...t, liked: !track.liked } : t,
        ),
      })
    },
    onError: (error) => useNotice.getState().show(error.message),
  })
  return (
    <button
      className={track.liked ? 'liked icon-button' : 'icon-button'}
      disabled={mutation.isPending}
      aria-label={track.liked ? '取消喜欢' : '喜欢这首歌'}
      aria-pressed={!!track.liked}
      onClick={() => mutation.mutate()}
    >
      <Heart size={16} fill={track.liked ? 'currentColor' : 'none'} />
    </button>
  )
}
export function SongTable({
  tracks,
  rowHeight = 44,
  loadMore,
  hasMore,
  fetching,
  sourceId,
  sourceType = 'playlist',
}: {
  tracks: Track[]
  rowHeight?: 44 | 48 | 52
  loadMore?: () => void
  hasMore?: boolean
  fetching?: boolean
  sourceId?: string
  sourceType?: string
}) {
  const parent = useRef<HTMLDivElement>(null)
  const virtual = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => parent.current,
    estimateSize: () => rowHeight,
    overscan: 6,
  })
  const current = usePlayerPreferences((s) => s.queue[s.index]?.id)
  const items = virtual.getVirtualItems()
  const last = items[items.length - 1]?.index ?? -1
  useEffect(() => {
    if (last >= tracks.length - 4 && hasMore && !fetching) loadMore?.()
  }, [last, tracks.length, hasMore, fetching, loadMore])
  const queue = tracks.map((t) => ({
    ...t,
    sourceId: sourceId ?? t.id,
    sourceType,
  }))
  if (!tracks.length) return <Empty text="暂无歌曲" />
  return (
    <>
      <div
        ref={parent}
        className="song-scroll"
        tabIndex={0}
        role="region"
        aria-label="歌曲列表"
      >
        <table className="song-table" aria-rowcount={tracks.length + 1}>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">标题</th>
              <th scope="col">歌手</th>
              <th scope="col">专辑</th>
              <th scope="col">时长</th>
              <th scope="col">
                <span className="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody style={{ height: virtual.getTotalSize() }}>
            {items.map((item) => {
              const song = tracks[item.index]
              return (
                <tr
                  key={`${song.id}-${item.index}`}
                  aria-rowindex={item.index + 2}
                  style={{
                    height: rowHeight,
                    transform: `translateY(${item.start}px)`,
                  }}
                  className={`${song.id === current ? 'current' : ''} ${song.playable ? '' : 'unplayable'}`}
                  onDoubleClick={() => void player.playQueue(queue, item.index)}
                >
                  <td>
                    <button
                      aria-label={`播放 ${song.name}`}
                      onClick={() => void player.playQueue(queue, item.index)}
                    >
                      {song.id === current ? (
                        <Play size={14} />
                      ) : (
                        String(item.index + 1).padStart(2, '0')
                      )}
                    </button>
                  </td>
                  <th scope="row">
                    <button
                      title={song.name}
                      onClick={() => void player.playQueue(queue, item.index)}
                    >
                      {song.name}
                    </button>
                    {!song.playable && <small>暂不可播</small>}
                  </th>
                  <td>
                    {song.artists.map((a, i) => (
                      <span key={a.id || i}>
                        {i > 0 && ' / '}
                        <Link to={`/artist/${encodeURIComponent(a.id)}`}>
                          {a.name}
                        </Link>
                      </span>
                    ))}
                  </td>
                  <td>
                    {song.album.id ? (
                      <Link to={`/album/${encodeURIComponent(song.album.id)}`}>
                        {song.album.name}
                      </Link>
                    ) : (
                      song.album.name
                    )}
                  </td>
                  <td>{duration(song.duration)}</td>
                  <td className="song-actions">
                    <LikeButton track={song} />
                    <Link
                      aria-label={`${song.name}的评论`}
                      to={`/comment/${encodeURIComponent(song.id)}`}
                    >
                      <MessageCircle size={16} />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <button className="load-more" disabled={fetching} onClick={loadMore}>
          {fetching ? '加载中…' : '加载更多歌曲'}
        </button>
      )}
    </>
  )
}
export function PlayAll({
  tracks,
  sourceId,
  sourceType = 'playlist',
}: {
  tracks: Track[]
  sourceId?: string
  sourceType?: string
}) {
  return (
    <button
      className="primary"
      disabled={!tracks.length}
      onClick={() =>
        void player.playQueue(
          tracks.map((track) => ({
            ...track,
            sourceId: sourceId ?? track.id,
            sourceType,
          })),
        )
      }
    >
      <Play size={14} fill="currentColor" /> 播放全部
    </button>
  )
}
