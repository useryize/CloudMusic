import { request } from '../lib/request'
export const getPlaylistDetail = (id: number) =>
  request<unknown>('/openapi/music/basic/playlist/detail/get/v2', { id })
