import { request } from '../lib/request'
export const getHotKeywords = () =>
  request<unknown>('/openapi/music/basic/search/hot/keyword/get/v2')
