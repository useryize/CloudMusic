import { request } from '../lib/request'
import { entity, list, track } from './types'
export const getPlaylistDetail = async (playlistId: string) =>
  entity(
    await request('/openapi/music/basic/playlist/detail/get/v2', {
      playlistId,
    }),
  )
export const getPlaylistTracks = async (playlistId: string, offset = 0) =>
  list(
    await request('/openapi/music/basic/playlist/song/list/get/v5', {
      playlistId,
      limit: 50,
      offset,
      qualityFlag: true,
    }),
    track,
    50,
  )
export const subscribePlaylist = (id: string, subscribed: boolean) =>
  request(`/openapi/music/basic/playlist/${subscribed ? 'unsub' : 'sub'}/v2`, {
    id,
  })
