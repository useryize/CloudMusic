export class ApiError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message)
  }
}
export class SetupRequiredError extends ApiError {
  constructor() {
    super(409, '请先配置应用凭证')
  }
}
export async function request<T>(
  path: string,
  biz: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch('/api/rpc', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path, biz }),
  })
  if (response.status === 409) throw new SetupRequiredError()
  const body = (await response.json()) as {
    code: number
    msg?: string
    message?: string
    subCode?: number | string | null
    comment?: T
    data: T
  }
  if (!response.ok || body.code !== 200)
    throw new ApiError(
      body.code || response.status,
      body.msg || body.message || '请求失败',
    )
  if (body.subCode && !['200', '0'].includes(String(body.subCode)))
    throw new ApiError(
      Number(body.subCode),
      body.msg || body.message || '当前资源暂不可用',
    )
  return body.data ?? (body.comment as T)
}
