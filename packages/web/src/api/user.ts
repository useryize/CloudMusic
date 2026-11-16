import { request } from '../lib/request'
import { entity, track, list } from './types'
import type { Profile, AuthStatus } from './types'
export async function localApi<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(
    path,
    body === undefined
      ? undefined
      : {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        },
  )
  const result = (await response.json()) as T & { msg?: string }
  if (!response.ok) throw new Error(result.msg || '本地服务请求失败')
  return result
}
export const authStatus = () => localApi<AuthStatus>('/api/auth/status')
export const userProfile = () =>
  request<Profile>('/openapi/music/basic/user/profile/get/v2')
export const likedPlaylist = async () =>
  entity(await request('/openapi/music/basic/playlist/star/get/v2'))
export const recentSongs = async () =>
  list(
    await request('/openapi/music/basic/song/play/record/list', { limit: 100 }),
    track,
    100,
  )
export const savedPlaylists = async (offset = 0) =>
  list(
    await request('/openapi/music/basic/playlist/subed/get/v2', {
      limit: 30,
      offset,
    }),
    entity,
  )
export const likeSong = (songId: string, isLike: boolean) =>
  request('/openapi/music/basic/playlist/song/like/v2', { songId, isLike })
