<template>
  <header class="site-header">
    <div class="site-header__inner">
      <router-link to="/" class="brand" aria-label="回到首页">
        <span class="brand__mark" aria-hidden="true" />
        <span class="brand__text">燕窝</span>
        <span class="brand__sub">Blog</span>
      </router-link>

      <nav class="nav" aria-label="主导航">
        <router-link
          to="/"
          class="nav__link"
          :class="{ 'nav__link--active': isHome }"
        >首页</router-link
        >
        <router-link
          to="/tags"
          class="nav__link"
          :class="{ 'nav__link--active': isTags }"
        >标签</router-link
        >
        <router-link
          to="/archive"
          class="nav__link"
          :class="{ 'nav__link--active': isArchive }"
        >归档</router-link
        >
        <router-link
          v-if="userStore.token"
          to="/create"
          class="nav__link"
          :class="{ 'nav__link--active': isCreate }"
        >写作</router-link
        >
        <router-link
          v-if="userStore.token"
          to="/my-posts"
          class="nav__link"
          :class="{ 'nav__link--active': isMyPosts }"
        >我的文章</router-link
        >
      </nav>

      <form class="search" @submit.prevent="onSearch" role="search" aria-label="全站文章搜索">
        <input
          v-model="searchText"
          type="search"
          class="input-text search__input"
          placeholder="搜索文章…"
          aria-label="搜索关键词"
        />
        <button type="submit" class="btn btn-primary btn-sm search__btn" aria-label="搜索">搜</button>
      </form>

      <div class="actions">
        <button
          type="button"
          class="theme-toggle"
          :aria-pressed="isDark"
          :title="isDark ? '切换到浅色模式' : '切换到夜间模式'"
          @click="toggleTheme"
        >
          {{ isDark ? '☀︎' : '☾' }}
        </button>
        <template v-if="userStore.token">
          <router-link to="/me" class="user-name" :title="userStore.userInfo?.email || ''">
            {{ userStore.userInfo?.username }}
          </router-link>
          <router-link
            v-if="userStore.userInfo?.role === 'admin'"
            to="/admin/dashboard"
            class="btn btn-ghost btn-sm"
          >后台</router-link
          >
          <button type="button" class="btn btn-ghost btn-sm" @click="logout">退出</button>
        </template>
        <template v-else>
          <router-link to="/login" class="btn btn-ghost btn-sm">登录</router-link>
          <router-link to="/register" class="btn btn-primary btn-sm">注册</router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const searchText = ref('')
const isDark = ref(false)

const isHome = computed(() => route.path === '/')
const isTags = computed(() => route.path === '/tags')
const isArchive = computed(() => route.path === '/archive')
const isCreate = computed(() => route.path === '/create')
const isMyPosts = computed(() => route.path === '/my-posts')

watch(
  () => [route.path, route.query.q, route.query.tag],
  () => {
    if (route.path === '/') {
      searchText.value = route.query.q ? String(route.query.q) : ''
    }
  },
  { immediate: true }
)

const onSearch = () => {
  const q = searchText.value.trim()
  const query = {}
  if (q) query.q = q
  if (route.query.tag) query.tag = String(route.query.tag)
  if (route.query.category) query.category = String(route.query.category)
  if (route.query.sort) query.sort = String(route.query.sort)
  if (!query.q && !query.tag && !query.category && !query.sort) {
    router.push({ path: '/' })
    return
  }
  router.push({ path: '/', query })
}

const applyTheme = (dark) => {
  isDark.value = dark
  const root = document.documentElement
  if (dark) root.setAttribute('data-theme', 'dark')
  else root.removeAttribute('data-theme')
  localStorage.setItem('theme', dark ? 'dark' : 'light')
}

const initTheme = () => {
  const stored = localStorage.getItem('theme')
  if (stored === 'dark') return applyTheme(true)
  if (stored === 'light') return applyTheme(false)
  const preferDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme(preferDark)
}

const toggleTheme = () => applyTheme(!isDark.value)

const logout = () => {
  userStore.logout()
  router.push('/')
}

onMounted(initTheme)
</script>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 252, 247, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}
.site-header__inner {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 0.65rem 1.25rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.25rem;
  min-height: var(--header-h);
  box-sizing: border-box;
}
.brand {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  text-decoration: none;
  color: var(--color-ink);
  font-weight: 700;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}
.brand__mark {
  display: block;
  width: 0.5rem;
  height: 1.6rem;
  background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-accent) 100%);
  border-radius: 2px;
  margin-right: 0.1rem;
}
.brand__text {
  font-size: 1.2rem;
}
.brand__sub {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-ink-muted);
  letter-spacing: 0.12em;
}
.nav {
  display: flex;
  gap: 0.25rem;
  flex: 0 0 auto;
}
.nav__link {
  padding: 0.4rem 0.7rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-ink-muted);
  border-radius: 6px;
  text-decoration: none;
  transition: color 0.2s, background 0.2s;
}
.nav__link:hover,
.nav__link--active {
  color: var(--color-ink);
  background: rgba(45, 74, 62, 0.08);
}
.search {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex: 1 1 200px;
  min-width: 0;
  max-width: 320px;
  margin: 0 auto;
}
.search__input {
  flex: 1;
  min-width: 0;
  padding: 0.4rem 0.7rem;
  font-size: 0.9rem;
}
.search__btn {
  flex-shrink: 0;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-left: auto;
}
.theme-toggle {
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-bg-elevated);
  color: var(--color-ink);
  font-size: 0.95rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
}
.theme-toggle:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.user-name {
  font-size: 0.9rem;
  color: var(--color-ink-muted);
  max-width: 6rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: none;
}
@media (min-width: 900px) {
  .user-name {
    display: block;
  }
}
@media (max-width: 720px) {
  .search {
    order: 10;
    width: 100%;
    max-width: none;
    margin: 0;
  }
  .actions {
    margin-left: 0;
  }
}
</style>
