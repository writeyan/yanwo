/** 认证与用户资料相关接口（前缀由 request 的 baseURL 提供，实际路径 /api/v1/auth/...） */
import request from './request'

export const loginApi = (data) => request.post('/auth/login', data)
export const registerApi = (data) => request.post('/auth/register', data)
export const getProfileApi = () => request.get('/auth/profile')
export const updateProfileApi = (data) => request.put('/auth/profile', data)
export const changePasswordApi = (data) => request.put('/auth/password', data)
export const uploadAvatarApi = (file) => {
  const fd = new FormData()
  fd.append('avatar', file)
  return request.post('/auth/avatar', fd)
}