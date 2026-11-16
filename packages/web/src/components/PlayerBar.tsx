import { Link } from 'react-router'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Repeat,
  Repeat1,
  Shuffle,
  ListMusic,
  MessageCircle,
} from 'lucide-react'
import { usePlayerPreferences as usePlayer } from '../player/store'
import type { Quality } from '../player/store'
import { player } from '../player/engine'
import { duration } from '../lib/format'
import { Cover, LikeButton } from './Music'
import { useQuery } from '@tanstack/react-query'
import { authStatus } from '../api/user'
import { useConnection } from '../api/connection'
export function AuthBadge() {
  const query = useQuery({
    queryKey: ['auth'],
    queryFn: authStatus,
    staleTime: 60000,
  })
  return (
    <Link to={query.data?.loggedIn ? '/mine' : '/login'}>
      {query.data?.loggedIn
        ? '我的账户'
        : query.data?.anonymous
          ? '匿名体验 · 登录'
          : '登录'}
    </Link>
  )
}
export function PlayerBar() {
  const state = usePlayer()
  const cli = useConnection().data?.backend === 'cli' || state.backend === 'cli'
  const track = state.queue[state.index]
  return (
    <footer className="live-player">
      <div className="player-track">
        <Link to="/now-playing" aria-label="打开播放页">
          <Cover src={track?.coverImgUrl} name={track?.name || '暂无播放'} />
        </Link>
        <div>
          <Link to="/now-playing" className="track-title">
            {track?.name || '音乐，随时陪伴'}
          </Link>
          <p>
            {track?.artists.map((a) => a.name).join(' / ') ||
              '选择一首喜欢的歌'}
          </p>
        </div>
        {track && <LikeButton track={track} />}
      </div>
      <div className="player-center">
        <div className="player-buttons">
          <button
            className={state.shuffle ? 'liked' : ''}
            aria-label="随机播放"
            aria-pressed={state.shuffle}
            onClick={() => usePlayer.setState({ shuffle: !state.shuffle })}
          >
            <Shuffle size={16} />
          </button>
          <button
            aria-label="上一首"
            onClick={() => void player.prev()}
            disabled={!track}
          >
            <SkipBack size={18} />
          </button>
          <button
            className="round-play"
            aria-label={state.status === 'playing' ? '暂停' : '播放'}
            disabled={!track || state.status === 'resolving'}
            onClick={() => void player.toggle()}
          >
            {state.status === 'playing' ? (
              <Pause size={18} />
            ) : (
              <Play size={18} />
            )}
          </button>
          <button
            aria-label="下一首"
            onClick={() => {
              player.unlock()
              void player.next()
            }}
            disabled={!track}
          >
            <SkipForward size={18} />
          </button>
          <button
            aria-label={`循环模式：${state.repeat === 'all' ? '列表循环' : state.repeat === 'one' ? '单曲循环' : '顺序播放'}`}
            aria-pressed={state.repeat !== 'off'}
            className={state.repeat !== 'off' ? 'liked' : ''}
            onClick={() =>
              usePlayer.setState({
                repeat:
                  state.repeat === 'off'
                    ? 'all'
                    : state.repeat === 'all'
                      ? 'one'
                      : 'off',
              })
            }
          >
            {state.repeat === 'one' ? (
              <Repeat1 size={16} />
            ) : (
              <Repeat size={16} />
            )}
          </button>
        </div>
        <div className="player-progress">
          <span>{duration(state.currentTime)}</span>
          <input
            aria-label="播放进度"
            type="range"
            min="0"
            max={state.duration || 1}
            step="0.1"
            disabled={!track}
            value={Math.min(state.currentTime, state.duration || 1)}
            onChange={(e) => player.seek(Number(e.target.value))}
          />
          <span>{duration(state.duration)}</span>
        </div>
        {state.error && (
          <span className="player-error" role="status">
            {state.error}
          </span>
        )}
      </div>
      <div className="player-tools">
        {!cli && (
          <label>
            <span className="sr-only">音质</span>
            <select
              value={state.quality}
              onChange={(e) =>
                void player.setQuality(e.target.value as Quality)
              }
            >
              <option value="standard">标准</option>
              <option value="higher">较高</option>
              <option value="exhigh">极高</option>
              <option value="lossless">无损</option>
            </select>
          </label>
        )}
        <label className="volume-control">
          <Volume2 size={16} />
          <span className="sr-only">音量</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={state.volume}
            onChange={(e) => player.setVolume(Number(e.target.value))}
          />
        </label>
        {track && (
          <Link
            aria-label="评论"
            to={`/comment/${encodeURIComponent(track.id)}`}
          >
            <MessageCircle size={16} />
          </Link>
        )}
        <details className="queue-menu">
          <summary aria-label="播放队列">
            <ListMusic size={18} />
          </summary>
          <div>
            <h2>播放队列 · {state.queue.length}</h2>
            {state.queue.length ? (
              state.queue.map((song, index) => (
                <button
                  key={`${song.id}-${index}`}
                  className={state.index === index ? 'current' : ''}
                  onClick={() => void player.playQueue(state.queue, index)}
                >
                  {index + 1}. {song.name}
                </button>
              ))
            ) : (
              <p>还没有歌曲</p>
            )}
          </div>
        </details>
      </div>
    </footer>
  )
}
