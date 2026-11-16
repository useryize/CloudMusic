export interface Entity {
  originalId?: string
  id: string
  name: string
  coverImgUrl?: string
  describe?: string
  description?: string
  briefDesc?: string
  creatorNickName?: string
  trackCount?: number
  playCount?: number
  subed?: boolean
  artists?: Entity[]
  publishTime?: number
  updateFrequency?: string
  threadId?: string
}
export interface Track {
  originalId?: string
  id: string
  name: string
  duration: number
  coverImgUrl?: string
  artists: Entity[]
  album: Entity
  liked?: boolean
  playable: boolean
  alg?: string
  sourceId?: string
  sourceType?: string
}
export interface ListPage<T> {
  items: T[]
  total?: number
  more: boolean
  cursor?: string
}
export interface Profile {
  id: string
  nickname: string
  avatarUrl?: string
  signature?: string
}
export interface Comment {
  id?: string
  content: string
  nickname: string
  avatarUrl?: string
  likedCount: number
  time?: number
  threadId?: string
}
export interface AuthStatus {
  loggedIn: boolean
  anonymous: boolean
}
export const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
export const text = (value: unknown) =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : ''
export const imageUrl = (value: unknown) => {
  const url = text(value)
  return /^https?:\/\//.test(url) ? url.replace(/^http:/, 'https:') : ''
}
export function entity(value: unknown): Entity {
  const v = object(value)
  return {
    originalId: text(v.originalId) || undefined,
    id: text(v.id ?? v.playlistId),
    name: text(v.name),
    coverImgUrl: imageUrl(v.coverImgUrl ?? v.picUrl ?? v.imgUrl),
    describe: text(v.describe ?? v.desc),
    description: text(v.description),
    briefDesc: text(v.briefDesc),
    creatorNickName: text(v.creatorNickName ?? v.djName),
    trackCount: Number(v.trackCount ?? 0),
    playCount: Number(v.playCount ?? 0),
    subed: v.subed === true,
    artists: Array.isArray(v.artists) ? v.artists.map(entity) : [],
    publishTime: Number(v.publishTime ?? 0),
    updateFrequency: text(v.updateFrequency),
    threadId: text(v.threadId ?? v.commentThreadId),
  }
}
export function track(value: unknown): Track {
  const v = object(value)
  return {
    originalId: text(v.originalId) || undefined,
    id: text(v.id),
    name: text(v.name),
    duration: Number(v.duration ?? 0) / 1000,
    coverImgUrl: imageUrl(v.coverImgUrl),
    artists: Array.isArray(v.artists)
      ? v.artists.map(entity)
      : v.artistId
        ? [{ id: text(v.artistId), name: text(v.artistName) }]
        : [],
    album: v.album
      ? entity(v.album)
      : { id: text(v.albumId), name: text(v.albumName) },
    liked: v.liked === true,
    playable: v.playFlag !== false && v.visible !== false,
    alg: text(v.alg),
  }
}
export function list<T>(
  raw: unknown,
  convert: (v: unknown) => T,
  limit = 30,
): ListPage<T> {
  const v = object(raw)
  const page = object(v.page)
  const values = Array.isArray(raw)
    ? raw
    : (([v.records, v.tracks, v.list, v.comments].find(Array.isArray) as
        unknown[] | undefined) ?? [])
  const totalValue =
    v.recordCount ?? v.trackCount ?? v.total ?? page.recordCount
  const total = totalValue == null ? undefined : Number(totalValue)
  return {
    items: values.map(convert),
    total,
    cursor: text(v.cursor ?? page.cursor),
    more:
      typeof page.more === 'boolean'
        ? page.more
        : typeof v.more === 'boolean'
          ? v.more
          : values.length >= limit,
  }
}
export function comment(value: unknown): Comment {
  const v = object(value)
  const user = object(v.user)
  return {
    id: text(v.id ?? v.commentId) || undefined,
    content: text(v.content),
    nickname: text(v.creatorNickName ?? v.nickName ?? user.nickname),
    avatarUrl: imageUrl(user.avatarUrl),
    likedCount: Number(v.likedCount ?? 0),
    time: Number(v.time ?? 0),
    threadId: text(v.threadId),
  }
}
