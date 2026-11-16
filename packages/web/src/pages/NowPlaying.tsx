import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { usePlayerPreferences } from '../player/store'
import { parseLyrics, lyricIndex } from '../player/lyrics'
import { player } from '../player/engine'
import { request } from '../lib/request'
import { Cover, QueryState } from '../components/Music'
import { PlayerBar } from '../components/PlayerBar'
export function NowPlayingPage() {
  const track = usePlayerPreferences((s) => s.queue[s.index])
  const time = usePlayerPreferences((s) => s.currentTime)
  const query = useQuery({
    queryKey: ['lyric', track?.id],
    queryFn: () =>
      request<{ lyric?: string; txtLyric?: string; pureMusic?: boolean }>(
        '/openapi/music/basic/song/lyric/get/v2',
        { songId: track!.id },
      ),
    enabled: !!track,
    staleTime: Infinity,
    gcTime: 30 * 60000,
  })
  const lines = parseLyrics(query.data?.lyric || '')
  const active = lyricIndex(lines, time)
  const current = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    current.current?.scrollIntoView({
      block: 'center',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    })
  }, [active])
  return (
    <div className="now-playing">
      <header>
        <Link className="secondary" to="/">
          ⌄ 返回发现音乐
        </Link>
        {track && (
          <Link to={`/comment/${encodeURIComponent(track.id)}`}>
            查看评论 →
          </Link>
        )}
      </header>
      <main>
        {track ? (
          <>
            <div className="now-cover">
              <Cover src={track.coverImgUrl} name={track.name} />
              <h1>{track.name}</h1>
              <p>
                {track.artists.map((a) => (
                  <Link key={a.id} to={`/artist/${encodeURIComponent(a.id)}`}>
                    {a.name}{' '}
                  </Link>
                ))}
              </p>
              <p className="muted">{track.album.name}</p>
            </div>
            <div
              className="lyrics"
              tabIndex={0}
              role="region"
              aria-label="歌词"
            >
              <QueryState
                pending={query.isPending}
                error={query.error}
                retry={() => void query.refetch()}
              />
              {lines.length ? (
                <div className="lyrics-lines">
                  {lines.map((line, index) => (
                    <button
                      ref={active === index ? current : undefined}
                      key={`${line.time}-${index}`}
                      className={active === index ? 'active-lyric' : ''}
                      onClick={() => player.seek(line.time)}
                    >
                      {line.text || '♪'}
                    </button>
                  ))}
                </div>
              ) : (
                query.data && (
                  <p>
                    {query.data.pureMusic
                      ? '纯音乐，请欣赏'
                      : query.data.txtLyric || '暂无歌词'}
                  </p>
                )
              )}
            </div>
          </>
        ) : (
          <div className="empty">
            <h1>还没有正在播放的音乐</h1>
            <Link to="/">去发现喜欢的歌曲 →</Link>
          </div>
        )}
      </main>
      <PlayerBar />
    </div>
  )
}
