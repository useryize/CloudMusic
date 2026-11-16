import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  ArrowUpRight,
  Disc3,
  CalendarDays,
  SlidersHorizontal,
} from 'lucide-react'
import { getHotKeywords } from '../api/search'
import { getPlaylistDetail } from '../api/playlist'
import { SetupRequiredError } from '../lib/request'
export function Result({
  data,
  error,
  pending,
}: {
  data?: unknown
  error: Error | null
  pending: boolean
}) {
  if (pending) return <p role="status">正在连接开放平台…</p>
  if (error)
    return (
      <div role="alert" className="empty">
        {error.message}
        {error instanceof SetupRequiredError && (
          <Link to="/setup">配置应用凭证 →</Link>
        )}
      </div>
    )
  if (data !== undefined)
    return <pre className="result">{JSON.stringify(data, null, 2)}</pre>
  return null
}
export function DiscoverPage() {
  const query = useQuery({
    queryKey: ['search', 'hot'],
    queryFn: getHotKeywords,
    enabled: false,
    staleTime: 600000,
  })
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">为你而来</p>
          <h1>发现音乐</h1>
        </div>
        <Link to="/square">
          歌单广场 <ArrowUpRight size={16} />
        </Link>
      </div>
      <nav className="tabs" aria-label="发现分类">
        <span aria-current="page">个性推荐</span>
        <Link to="/square">歌单</Link>
        <Link to="/toplist">排行榜</Link>
      </nav>
      <Link to="/daily" className="daily-banner">
        <div>
          <span className="eyebrow">DAILY RECOMMENDATION</span>
          <h2>把今天，交给音乐。</h2>
          <p>每日推荐 · 发现属于你的旋律</p>
          <span className="pill">查看每日推荐 →</span>
        </div>
        <CalendarDays size={100} strokeWidth={1} />
      </Link>
      <section>
        <div className="section-heading">
          <h2>开始你的音乐之旅</h2>
          <span className="muted">连接网易云音乐开放平台</span>
        </div>
        <div className="entry-grid">
          {[
            {
              to: '/setup',
              title: '应用配置',
              desc: '配置 appId 与 RSA 私钥',
              icon: SlidersHorizontal,
            },
            {
              to: '/square',
              title: '探索歌单',
              desc: '在歌单里遇见新的喜欢',
              icon: Disc3,
            },
            {
              to: '/toplist',
              title: '音乐排行榜',
              desc: '发现当下的热门声音',
              icon: ArrowUpRight,
            },
          ].map(({ to, title, desc, icon: Icon }) => (
            <Link className="entry" to={to} key={to}>
              <Icon size={28} />
              <h3>{title}</h3>
              <p>{desc}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="connection">
        <div>
          <h2>开放平台连接测试</h2>
          <p className="muted">发送只读热搜请求，验证本地签名与接口链路。</p>
        </div>
        <button
          className="primary"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {query.isFetching ? '请求中…' : '测试请求'}
        </button>
      </section>
      <Result
        data={query.data}
        error={query.error}
        pending={query.isFetching}
      />
    </>
  )
}
export function PlaylistPage() {
  const { id = '' } = useParams()
  const valid = /^\d+$/.test(id) && Number.isSafeInteger(Number(id))
  const query = useQuery({
    queryKey: ['playlist', id, 'detail'],
    queryFn: () => getPlaylistDetail(Number(id)),
    enabled: valid,
  })
  return (
    <>
      <p className="eyebrow">PLAYLIST</p>
      <h1>歌单详情</h1>
      <p className="muted">歌单 ID · {id}</p>
      {valid ? (
        <Result
          data={query.data}
          error={query.error}
          pending={query.isPending}
        />
      ) : (
        <p role="alert">歌单 ID 无效</p>
      )}
    </>
  )
}
export function SetupPage() {
  const [appId, setAppId] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const status = useQuery({
    queryKey: ['setup'],
    queryFn: async () => {
      const res = await fetch('/api/setup')
      if (!res.ok) throw new Error('无法读取配置状态')
      return (await res.json()) as { configured: boolean }
    },
  })
  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ appId: appId.trim(), privateKey }),
      })
      const body = (await res.json()) as { msg?: string }
      if (!res.ok) throw new Error(body.msg || '保存失败')
    },
    onSuccess: () => {
      setPrivateKey('')
      void status.refetch()
    },
  })
  return (
    <div className="setup">
      <p className="eyebrow">GET CONNECTED</p>
      <h1>连接你的音乐世界</h1>
      <p className="muted">填写开放平台应用凭证，开始使用云音乐。</p>
      <p role="status">
        {status.data?.configured
          ? '已配置应用凭证，可重新保存以更新。'
          : '尚未配置应用凭证。'}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          save.mutate()
        }}
      >
        <label htmlFor="appId">应用 appId</label>
        <input
          id="appId"
          required
          value={appId}
          onChange={(event) => setAppId(event.target.value)}
          autoComplete="off"
        />
        <label htmlFor="privateKey">RSA 私钥（PEM）</label>
        <textarea
          id="privateKey"
          required
          rows={8}
          value={privateKey}
          onChange={(event) => setPrivateKey(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="muted">凭证保存在本机服务端，页面不读取已保存的私钥。</p>
        <button className="primary" disabled={save.isPending}>
          {save.isPending ? '保存中…' : '保存配置'}
        </button>
        {save.isError && <p role="alert">{save.error.message}</p>}
        {save.isSuccess && (
          <p role="status">
            配置已保存。<Link to="/">返回首页测试连接 →</Link>
          </p>
        )}
      </form>
    </div>
  )
}
export function ScaffoldPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const [params] = useSearchParams()
  return (
    <>
      <p className="eyebrow">云音乐</p>
      <h1>{title}</h1>
      <p className="muted">{description}</p>
      {params.get('q') && <p>搜索关键词：{params.get('q')}</p>}
      <div className="empty">
        <Disc3 size={40} strokeWidth={1} />
        <h2>即将与你相遇</h2>
        <p>页面骨架已就绪，业务功能将在后续阶段接入。</p>
        <Link to="/">返回发现音乐 →</Link>
      </div>
    </>
  )
}
