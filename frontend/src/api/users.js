/**
 * 管理员用户 API：`/api/v1/users`，需 JWT 且 role 为 admin。
 */
import request from './request'

export const listUsersAdmin = (params) => request.get('/users', { params })
export const patchUserAdmin = (id, data) => request.patch(`/users/${id}`, data)
