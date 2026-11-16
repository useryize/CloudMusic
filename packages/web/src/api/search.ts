import { request } from '../lib/request'
import { entity, list, track } from './types'
export const getHotKeywords = () =>
  request<unknown>('/openapi/music/basic/search/hot/keyword/get/v2')
export const searchTypes = {
  song: '单曲',
  playlist: '歌单',
  album: '专辑',
  artist: '艺人',
  mv: 'MV',
  podcast: '播客',
} as const
export type SearchType = keyof typeof searchTypes
const paths: Record<SearchType, string> = {
  song: '/openapi/music/basic/search/song/get/v3',
  playlist: '/openapi/music/basic/search/playlist/get/v2',
  album: '/openapi/music/basic/search/album/get/v2',
  artist: '/openapi/music/basic/search/artists/get/v2',
  mv: '/openapi/music/basic/search/mv/get/v1',
  podcast: '/openapi/search/multi/terminal/voicelist',
}
export const searchSongs = async (keyword: string, offset = 0) =>
  list(await request(paths.song, { keyword, limit: 30, offset }), track)
export const searchEntities = async (
  type: Exclude<SearchType, 'song'>,
  keyword: string,
  offset = 0,
) => list(await request(paths[type], { keyword, limit: 30, offset }), entity)
