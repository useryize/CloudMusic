import { request } from '../lib/request'
import { comment, list } from './types'
export const getComments = async (
  songId: string,
  sort: 'hot' | 'new',
  cursor = '',
) =>
  list(
    await request(
      sort === 'hot'
        ? '/openapi/music/comment/get-best-comments-by-song'
        : '/openapi/music/resource/comment/lv1/list/desc',
      { songId, limit: 20, ...(cursor ? { cursor } : {}) },
    ),
    comment,
    20,
  )
export const getCommentCount = (songId: string) =>
  request<{ recordCount: number }>('/openapi/music/basic/comments/get/v2', {
    resourceId: songId,
    type: 'song',
    limit: 1,
    offset: 0,
  })
export const publishComment = (
  resourceId: string,
  threadId: string,
  content: string,
  commentId?: string,
) =>
  request<unknown>(
    `/openapi/v1/resource/comments/${commentId ? 'reply' : 'add'}`,
    {
      resourceId,
      resourceType: 4,
      threadId,
      content,
      forwardEvent: 0,
      ...(commentId ? { commentId } : {}),
    },
  )
