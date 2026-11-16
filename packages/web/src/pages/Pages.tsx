import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Disc3 } from 'lucide-react'
import { SetupRequiredError } from '../lib/request'
import { DeviceSetup } from '../components/DeviceSetup'
import { useConnection } from '../api/connection'
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
export function SetupPage() {
  const cli = useConnection().data?.backend === 'cli'
  const [appId, setAppId] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const status = useQuery({
    queryKey: ['setup'],
    queryFn: async () => {
      const res = await fetch('/api/setup')
      if (!res.ok) throw new Error('无法读取配置状态')
      return (await res.json()) as {
        configured: boolean
        hasAppSecret: boolean
      }
    },
  })
  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ appId: appId.trim(), privateKey, appSecret }),
      })
      const body = (await res.json()) as { msg?: string }
      if (!res.ok) throw new Error(body.msg || '保存失败')
    },
    onSuccess: () => {
      setPrivateKey('')
      setAppSecret('')
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
        {!cli && (
          <>
            <label htmlFor="appSecret">AppSecret（选填，用于自动续期）</label>
            <input
              id="appSecret"
              name="appSecret"
              type="password"
              value={appSecret}
              onChange={(event) => setAppSecret(event.target.value)}
              autoComplete="off"
            />
            <p className="muted">
              {status.data?.hasAppSecret
                ? '已保存 AppSecret；同一应用留空保留原值。'
                : '未配置时，登录到期后需要重新扫码。'}
            </p>
          </>
        )}
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
      {!cli && <DeviceSetup />}
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
