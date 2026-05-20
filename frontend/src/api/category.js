/**
 * 分类 API：与后端 `/api/v1/categories` 对齐；写操作需管理员，由后端鉴权。
 */
import request from './request'

export const getCategories = () => request.get('/categories')
export const createCategory = (data) => request.post('/categories', data)
export const updateCategory = (id, data) => request.put(`/categories/${id}`, data)
export const deleteCategory = (id) => request.delete(`/categories/${id}`)
