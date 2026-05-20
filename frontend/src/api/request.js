/**
 * Axios 封装
 *
 * baseURL 默认 `/api/v1`，开发环境由 Vite 代理到 Express（vite.config.js）。
 * 请求拦截器附带 Bearer token；响应 401 时对非登录/注册请求清理本地会话并跳转登录页（带 redirect）。
 */
import axios from 'axios'

const request = axios.create({
  // 未配置时使用同源 /api/v1，配合 Vite 代理到本地后端
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 10000
})

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const full = `${error.config?.baseURL || ''}${error.config?.url || ''}`
      const isLoginOrRegister =
        full.includes('/auth/login') || full.includes('/auth/register')
      if (!isLoginOrRegister) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        const back = window.location.pathname + window.location.search
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?redirect=' + encodeURIComponent(back)
        }
      }
    }
    return Promise.reject(error)
  }
)

export default request