/**
 * Vite 开发服务器配置
 *
 * `/api`、`/uploads` 代理到后端（默认 localhost:5000），浏览器同源请求无 CORS。
 * `Cache-Control: no-store` 降低开发时缓存干扰。
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    headers: {
      'Cache-Control': 'no-store',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    }
  }
})