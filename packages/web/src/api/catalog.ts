import { request } from '../lib/request'
import { entity, track, list, object, text, imageUrl } from './types'
const basic = '/openapi/music/basic/'
export const recommendedPlaylists = async (offset = 0) =>
  list(
    await request(basic + 'recommend/playlist/get', { limit: 20, offset }),
    entity,
    20,
  )
export const dailyCover = async () => {
  const data = object(await request(basic + 'recommend/daily/image'))
  return { name: text(data.name), imgUrl: imageUrl(data.imgUrl ?? data.ImgUrl) }
}
export const dailySongs = async () =>
  list(
    await request(basic + 'recommend/songlist/get/v2', {
      limit: 30,
      qualityFlag: true,
    }),
    track,
  )
export const newSongs = async () =>
  list(
    await request(basic + 'new/song/chart/list/get', { limit: 10 }),
    track,
    10,
  )
export const toplists = async () =>
  list(await request(basic + 'toplist/get/v2'), entity)
export const albumDetail = async (albumId: string) =>
  entity(
    await request(basic + 'album/detail/get/v2', { albumId, descFlag: true }),
  )
export const albumSongs = async (albumId: string, offset = 0) =>
  list(
    await request(basic + 'album/song/list/get/v3', {
      albumId,
      offset,
      limit: 50,
    }),
    track,
    50,
  )
export const artistDetail = async (artistId: string) =>
  entity(
    await request(basic + 'artist/detail/get/v2', { artistId, extFlag: true }),
  )
export const artistSongs = async (artistId: string, offset = 0) =>
  list(
    await request(basic + 'artists/song/list/get', {
      artistId,
      offset,
      limit: 50,
    }),
    track,
    50,
  )
export const artistAlbums = async (artistId: string, offset = 0) =>
  list(
    await request(basic + 'artists/album/list/bytype/get/v3', {
      artistId,
      sortType: 'pubTime',
      offset,
      limit: 20,
    }),
    entity,
    20,
  )
export const subscribeAlbum = (id: string, subscribed: boolean) =>
  request(basic + `album/${subscribed ? 'unsub' : 'sub'}`, { albumId: id })
