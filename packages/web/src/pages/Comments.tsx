import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import { authStatus } from '../api/user'
import { getCommentCount, getComments, publishComment } from '../api/comment'
import type { Comment } from '../api/types'
import { usePlayerPreferences } from '../player/store'
import { Cover, Empty, QueryState } from '../components/Music'
import { queryClient } from '../lib/queryClient'
export function CommentPage() {
  const { songId = '' } = useParams()
  const [sort, setSort] = useState<'hot' | 'new'>('hot')
  const [draft, setDraft] = useState('')
  const [reply, setReply] = useState<Comment>()
  const [share, setShare] = useState('')
  const [posted, setPosted] = useState<Comment[]>([])
  const track = usePlayerPreferences((s) =>
    s.queue.find((t) => t.id === songId),
  )
  const auth = useQuery({ queryKey: ['auth'], queryFn: authStatus })
  const total = useQuery({
    queryKey: ['comment', songId, 'count'],
    queryFn: () => getCommentCount(songId),
    staleTime: 60000,
  })
  const query = useInfiniteQuery({
    queryKey: ['comment', songId, sort],
    initialPageParam: '',
    queryFn: ({ pageParam }) => getComments(songId, sort, pageParam),
    getNextPageParam: (last) =>
      sort === 'new' && last.more && last.cursor ? last.cursor : undefined,
    staleTime: 60000,
  })
  const originalId = /^\d+$/.test(songId)
    ? songId
    : share.match(/(?:song\?id=|\/song\/|^)(\d+)(?:\D|$)/)?.[1]
  const threadId = reply?.threadId || (originalId ? `R_SO_4_${originalId}` : '')
  const mutation = useMutation({
    mutationFn: async () => {
      if (!threadId)
        throw new Error('请填写这首歌的网易云分享链接，以定位评论区')
      await publishComment(
        originalId || songId,
        threadId,
        draft.trim(),
        reply?.id,
      )
    },
    onSuccess: () => {
      setPosted((items) => [
        {
          content: draft.trim(),
          nickname: '我',
          likedCount: 0,
          time: Date.now(),
        },
        ...items,
      ])
      setDraft('')
      setReply(undefined)
      void queryClient.invalidateQueries({ queryKey: ['comment', songId] })
    },
  })
  return (
    <>
      <div className="comment-heading">
        {track && <Cover src={track.coverImgUrl} name={track.name} />}
        <div>
          <h1>{track ? `${track.name} · 评论` : '歌曲评论'}</h1>
          <p className="muted">
            {total.data
              ? `共 ${total.data.recordCount} 条评论`
              : '一起分享听歌的感受'}
          </p>
        </div>
      </div>
      <nav className="tabs" aria-label="评论排序">
        <button
          aria-current={sort === 'hot' ? 'page' : undefined}
          onClick={() => setSort('hot')}
        >
          最热
        </button>
        <button
          aria-current={sort === 'new' ? 'page' : undefined}
          onClick={() => setSort('new')}
        >
          最新
        </button>
      </nav>
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      />
      {[...posted, ...(query.data?.pages.flatMap((p) => p.items) ?? [])].map(
        (comment, i) => (
          <article
            className="comment-item"
            key={`${comment.id || 'comment'}-${i}`}
          >
            <div className="avatar small">{comment.nickname?.slice(0, 1)}</div>
            <div>
              <h3>{comment.nickname || '云音乐用户'}</h3>
              {comment.time ? (
                <small className="muted">
                  {new Date(comment.time).toLocaleString('zh-CN')}
                </small>
              ) : null}
              <p>{comment.content}</p>
              <small className="muted">♡ {comment.likedCount}</small>
              {comment.id && auth.data?.loggedIn && (
                <button onClick={() => setReply(comment)}>回复</button>
              )}
            </div>
          </article>
        ),
      )}
      {query.data &&
        !query.data.pages.some((p) => p.items.length) &&
        !posted.length && <Empty text="还没有可展示的评论" />}
      {query.hasNextPage && (
        <button
          className="load-more"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          加载更多评论
        </button>
      )}
      {auth.data?.loggedIn ? (
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
        >
          {reply && (
            <p>
              回复 {reply.nickname}
              <button type="button" onClick={() => setReply(undefined)}>
                取消回复
              </button>
            </p>
          )}
          {!/^\d+$/.test(songId) && !reply?.threadId && (
            <label>
              歌曲分享链接
              <input
                type="text"
                value={share}
                onChange={(e) => setShare(e.target.value)}
                placeholder="粘贴网易云音乐歌曲分享链接"
                required
              />
            </label>
          )}
          <label htmlFor="comment-content">说点什么…</label>
          <div>
            <textarea
              id="comment-content"
              name="content"
              required
              maxLength={1000}
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button
              className="primary"
              disabled={mutation.isPending || !draft.trim()}
            >
              {mutation.isPending ? '发送中…' : '发送'}
            </button>
          </div>
          <QueryState error={mutation.error} />
          {mutation.isSuccess && <p role="status">评论已提交</p>}
        </form>
      ) : (
        <p className="login-prompt">
          <Link to={`/login?next=${encodeURIComponent('/comment/' + songId)}`}>
            登录
          </Link>
          后参与评论
        </p>
      )}
    </>
  )
}
