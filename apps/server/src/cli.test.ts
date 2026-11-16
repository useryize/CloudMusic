import { it, expect } from 'vitest'
import { parseCliOutput } from './cli'
it('解析官方 CLI JSON，拒绝人类帮助文本或不完整输出', () => {
  expect(parseCliOutput('{"success":true,"data":{"records":[]}}')).toEqual({
    success: true,
    data: { records: [] },
  })
  expect(
    parseCliOutput('status\n{"success":false,"message":"未登录"}'),
  ).toEqual({ success: false, message: '未登录' })
  expect(() => parseCliOutput('error: unknown command')).toThrow(
    '未返回有效 JSON',
  )
})
