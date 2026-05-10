/** 文章相关 REST 封装：列表、详情(slug)、编辑(id)、归档、标签、点赞等 */
import request from './request'

export const getPosts = (params) => request.get('/posts', { params })
export const getRelatedPosts = (slug) => request.get(`/posts/related/${encodeURIComponent(slug)}`)
export const getPostRevisions = (postId) => request.get(`/posts/revisions/${postId}`)
export const getArchive = () => request.get('/posts/archive')
export const getTagStats = () => request.get('/posts/meta/tags')
export const getAdminPosts = (params) => request.get('/posts/admin/all', { params })
export const getMyPosts = () => request.get('/posts/mine')
export const getPostBySlug = (slug) => request.get(`/posts/${slug}`)
export const getPostByIdForEdit = (id) => request.get(`/posts/${id}/edit`)
export const uploadPostCover = (file) => {
  const fd = new FormData()
  fd.append('cover', file)
  return request.post('/posts/upload-cover', fd)
}

export const createPost = (data) => request.post('/posts', data)
export const updatePost = (id, data) => request.put(`/posts/${id}`, data)
export const deletePost = (id) => request.delete(`/posts/${id}`)
export const togglePostLike = (id) => request.post(`/posts/${id}/like`)