import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { localApi } from '../api/user'
import { QueryState } from './Music'
const labels: Record<string, string> = {
  channel: 'channel（平台分配）',
  deviceType: 'deviceType（平台分配）',
  os: 'os（平台分配）',
  brand: 'brand（平台分配）',
  model: '设备型号 model',
  osVer: '系统版本 osVer',
  appVer: '应用版本 appVer',
  clientIp: '当前终端出口 IP clientIp',
  netStatus: '网络状态 netStatus',
}
export function DeviceSetup() {
  const query = useQuery({
    queryKey: ['device'],
    queryFn: () =>
      localApi<{ device: Record<string, string>; fields: string[] }>(
        '/api/device',
      ),
  })
  const [draft, setDraft] = useState<Record<string, string>>({})
  const save = useMutation({
    mutationFn: () =>
      localApi('/api/device', { ...query.data?.device, ...draft }),
    onSuccess: () => void query.refetch(),
  })
  return (
    <section className="device-setup">
      <h2>设备参数</h2>
      <p className="muted">
        若接口提示公共参数校验失败，请填写开放平台为应用约定的设备参数。留空不会冒用其他厂商标识。设备唯一
        ID 由本机服务维护。
      </p>
      <QueryState pending={query.isPending} error={query.error} />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
      >
        {query.data?.fields.map((key) => (
          <div key={key}>
            <label htmlFor={`device-${key}`}>{labels[key] || key}</label>
            <input
              id={`device-${key}`}
              name={key}
              value={draft[key] ?? query.data?.device[key] ?? ''}
              onChange={(e) =>
                setDraft((v) => ({ ...v, [key]: e.target.value }))
              }
              autoComplete="off"
            />
          </div>
        ))}
        <button className="primary" disabled={save.isPending}>
          保存设备参数
        </button>
        <QueryState error={save.error} />
        {save.isSuccess && (
          <p role="status">设备参数已保存，返回首页重新加载即可。</p>
        )}
      </form>
    </section>
  )
}
