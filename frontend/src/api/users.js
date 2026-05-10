import request from './request'

export const listUsersAdmin = (params) => request.get('/users', { params })
export const patchUserAdmin = (id, data) => request.patch(`/users/${id}`, data)
