import { NavLink, Outlet, useNavigate } from 'react-router'
import {
  Compass,
  Disc3,
  Radio,
  Video,
  Heart,
  ListMusic,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react'
import { useState } from 'react'
import { usePlayerPreferences } from '../../player/store'
import s from './AppShell.module.css'
const nav = [
  { to: '/', label: '发现音乐', icon: Compass },
  { to: '/podcast', label: '播客频道', icon: Radio },
  { to: '/video', label: '视频', icon: Video },
  { to: '/toplist', label: '排行榜', icon: ListMusic },
]
export function AppShell() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [notice, setNotice] = useState('')
  const { volume, setVolume } = usePlayerPreferences()
  return (
    <div className={s.shell}>
      <a className={s.skip} href="#content">
        跳到内容
      </a>
      <aside className={s.sidebar}>
        <div className={s.logo}>
          <Disc3 size={30} color="var(--brand)" /> 云音乐 <small>PC</small>
        </div>
        <nav aria-label="主导航">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `${s.nav} ${isActive ? s.active : ''}`
              }
            >
              <Icon size={18} strokeWidth={1.5} />
              {label}
            </NavLink>
          ))}
          <p className={s.caption}>我的音乐</p>
          <NavLink to="/mine" className={s.nav}>
            <Heart size={18} />
            我的音乐
          </NavLink>
          <NavLink to="/square" className={s.nav}>
            <ListMusic size={18} />
            收藏歌单
          </NavLink>
        </nav>
        <button className={s.settings} onClick={() => navigate('/setup')}>
          <Settings size={18} />
          应用配置
        </button>
      </aside>
      <header className={s.header}>
        <button aria-label="后退" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
        </button>
        <button aria-label="前进" onClick={() => navigate(1)}>
          <ChevronRight size={18} />
        </button>
        <form
          className={s.search}
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            if (keyword.trim())
              navigate(`/search?q=${encodeURIComponent(keyword.trim())}`)
          }}
        >
          <Search size={16} />
          <input
            aria-label="搜索音乐"
            placeholder="搜索音乐、歌单、艺人"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </form>
        <span className={s.spacer} />
        <span className={s.quality}>Hi-Res</span>
        <NavLink to="/login">登录</NavLink>
      </header>
      <main id="content" className={s.content}>
        <Outlet />
      </main>
      <footer className={s.player}>
        <div className={s.track}>
          <div className={s.cover}>
            <Disc3 />
          </div>
          <div>
            <p>音乐，随时陪伴</p>
            <small>选择一首喜欢的歌</small>
          </div>
        </div>
        <div className={s.controls}>
          <div className={s.buttons}>
            <button
              aria-label="上一首"
              onClick={() => setNotice('播放功能开发中')}
            >
              <SkipBack size={18} />
            </button>
            <button
              className={s.play}
              aria-label="播放"
              onClick={() => setNotice('播放功能开发中')}
            >
              <Play size={18} />
            </button>
            <button
              aria-label="下一首"
              onClick={() => setNotice('播放功能开发中')}
            >
              <SkipForward size={18} />
            </button>
          </div>
          <div className={s.progress}>
            <small>00:00</small>
            <div />
            <small>00:00</small>
          </div>
        </div>
        <label className={s.volume}>
          <Volume2 size={18} />
          <span className={s.sr}>音量</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
          />
        </label>
      </footer>
      {notice && (
        <div role="status" className={s.toast}>
          {notice}
          <button onClick={() => setNotice('')} aria-label="关闭提示">
            ×
          </button>
        </div>
      )}
    </div>
  )
}
