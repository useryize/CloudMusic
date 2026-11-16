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
} from 'lucide-react'
import { useState } from 'react'
import { PlayerBar, AuthBadge } from '../PlayerBar'
import { useNotice } from '../../lib/ui'
import { useConnection } from '../../api/connection'
import s from './AppShell.module.css'
const nav = [
  { to: '/', label: '发现音乐', icon: Compass },
  { to: '/podcast', label: '播客频道', icon: Radio },
  { to: '/video', label: '视频', icon: Video },
  { to: '/toplist', label: '排行榜', icon: ListMusic },
]
export function AppShell() {
  const cli = useConnection().data?.backend === 'cli'
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const notice = useNotice((s) => s.message)
  const setNotice = useNotice((s) => s.show)

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
          {nav
            .filter((item) => !cli || item.to !== '/toplist')
            .map(({ to, label, icon: Icon }) => (
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
          <NavLink to="/mine?tab=saved" className={s.nav}>
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
        <AuthBadge />
      </header>
      <main id="content" className={s.content}>
        <Outlet />
      </main>
      <PlayerBar />
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
