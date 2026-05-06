/**
 * 前端应用入口：创建 Vue 应用，挂载 Pinia（全局状态）与 Vue Router（路由）。
 * HTML 入口见 index.html 中的 #app。
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './app.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')