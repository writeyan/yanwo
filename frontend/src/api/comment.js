/** 评论：列表、发表、点赞、举报；管理端待审与审核 */
import request from './request'

export const getComments = (postId, params) =>
  request.get(`/comments/post/${postId}`, { params })

export const reportComment = (id, data) => request.post(`/comments/${id}/report`, data || {})
export const createComment = (data) => request.post('/comments', data)
export const toggleCommentLike = (id) => request.post(`/comments/${id}/like`)
export const getPendingComments = () => request.get('/comments/admin/pending')
export const reviewComment = (id, action) => request.patch(`/comments/admin/${id}/review`, { action })