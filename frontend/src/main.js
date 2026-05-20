/**
 * 前端入口：挂载 Pinia 与 Vue Router 后挂载根组件。
 * 全局样式与主题变量见 app.vue / assets/theme.css。
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './app.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')