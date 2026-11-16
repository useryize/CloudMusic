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
    data: T
  }
  if (!response.ok || body.code !== 200)
    throw new ApiError(body.code || response.status, body.msg || '请求失败')
  return body.data
}
