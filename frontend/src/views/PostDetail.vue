<template>
  <div class="post-page">
    <div v-if="post" class="post-article">
      <div v-if="post.featuredImage" class="post-article__cover">
        <img :src="post.featuredImage" alt="" />
      </div>

      <div class="post-article__inner">
        <nav class="post-breadcrumb" aria-label="面包屑">
          <router-link to="/">首页</router-link>
          <span class="sep" aria-hidden="true">/</span>
          <span>正文</span>
        </nav>

        <header class="post-header">
          <h1 class="post-header__title">{{ post.title }}</h1>
          <div class="post-header__row">
            <p class="post-header__meta">
              <span class="by">{{ post.authorName }}</span>
              <time :datetime="post.publishedAt">· {{ formatDate(post.publishedAt) }}</time>
              <span>· 阅读 {{ post.viewCount }} · 约 {{ readMin }} 分钟</span>
            </p>
            <button type="button" class="btn btn-ghost btn-sm" @click="copyLink">复制链接</button>
          </div>
          <p v-if="copyOk" class="copy-ok" role="status">已复制当前链接到剪贴板</p>
          <div v-if="post.category?.name" class="post-category">
            <router-link class="post-category__link" :to="{ path: '/', query: { category: post.category.slug } }">
              分类 · {{ post.category.name }}
            </router-link>
          </div>
          <div v-if="post.tags?.length" class="post-header__tags">
            <router-link
              v-for="t in post.tags"
              :key="t"
              :to="{ path: '/', query: { tag: t } }"
              class="tag-pill"
              >#{{ t }}</router-link
            >
          </div>
          <div class="post-actions" aria-label="文章互动">
            <button
              type="button"
              class="post-like"
              :class="{ 'post-like--on': post.likedByMe }"
              :disabled="postLikeLoading"
              :title="userStore.token ? (post.likedByMe ? '取消赞' : '点赞') : '登录后点赞'"
              @click="onPostLike"
            >
              ♥
              <span class="post-like__n">{{ post.likeCount ?? 0 }}</span>
            </button>
            <span v-if="!userStore.token" class="post-like-tip">登录后可点赞</span>
          </div>
        </header>

        <aside v-if="toc.length" class="post-toc">
          <h3 class="post-toc__title">目录</h3>
          <ul class="post-toc__list">
            <li
              v-for="item in toc"
              :key="item.id"
              class="post-toc__item"
              :style="{ paddingLeft: `${(item.level - 1) * 10}px` }"
            >
              <a :href="`#${item.id}`">{{ item.text }}</a>
            </li>
          </ul>
        </aside>

        <article class="prose post-body" v-html="renderedContent" />

        <section v-if="relatedPosts.length" class="related-posts card">
          <h2 class="related-posts__title">你可能还喜欢</h2>
          <ul class="related-posts__list">
            <li v-for="rp in relatedPosts" :key="rp._id">
              <router-link :to="`/post/${rp.slug}`">{{ rp.title }}</router-link>
              <span class="related-posts__meta">{{ rp.authorName }} · ♥ {{ rp.likeCount ?? 0 }}</span>
            </li>
          </ul>
        </section>

        <CommentSection :postId="String(post._id)" />
      </div>
    </div>

    <div v-else-if="loadError" class="state state--error" role="alert">
      <p>文章加载失败或已被删除，请从首页重新进入。</p>
      <router-link to="/" class="btn btn-primary">回首页</router-link>
    </div>

    <div v-else class="state state--load">
      <div class="load-bar skeleton" style="height: 2.5rem; max-width: 18rem" />
      <div class="load-bar skeleton" style="height: 12rem" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPostBySlug, togglePostLike, getRelatedPosts } from '../api/post'
import { useUserStore } from '../store/user'
import { marked } from 'marked'
import CommentSection from '../components/CommentSection.vue'

marked.setOptions({ gfm: true, breaks: true })

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const post = ref(null)
const relatedPosts = ref([])
const loadError = ref(false)
const copyOk = ref(false)
const postLikeLoading = ref(false)
let copyTimer = null

const buildSlug = (text, exists) => {
  let slug = String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  if (!slug) slug = 'section'
  let id = slug
  let i = 1
  while (exists.has(id)) id = `${slug}-${i++}`
  exists.add(id)
  return id
}

const parsed = computed(() => {
  const content = post.value?.content || ''
  if (!content) return { html: '', toc: [] }
  const toc = []
  const used = new Set()
  const renderer = new marked.Renderer()
  renderer.heading = ({ text, depth }) => {
    const clean = String(text).replace(/<[^>]+>/g, '')
    const id = buildSlug(clean, used)
    toc.push({ id, text: clean, level: depth })
    return `<h${depth} id="${id}">${text}</h${depth}>`
  }
  const html = marked.parse(content, { renderer })
  return { html, toc: toc.filter((x) => x.level >= 1 && x.level <= 3) }
})

const renderedContent = computed(() => parsed.value.html)
const toc = computed(() => parsed.value.toc)

const readMin = computed(() => {
  const c = post.value?.content || ''
  const n = c.replace(/[\r\n\t\s#*`[\]()]/g, '').length
  return Math.max(1, Math.round(n / 450))
})

const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—')

const load = async () => {
  post.value = null
  relatedPosts.value = []
  loadError.value = false
  copyOk.value = false
  try {
    const res = await getPostBySlug(route.params.slug)
    post.value = res.data.data
    if (!post.value) loadError.value = true
    else {
      try {
        const rel = await getRelatedPosts(route.params.slug)
        relatedPosts.value = rel.data.data?.posts || []
      } catch {
        relatedPosts.value = []
      }
    }
  } catch (e) {
    loadError.value = true
    post.value = null
  }
}

onMounted(load)

watch(
  () => route.params.slug,
  () => {
    load()
  }
)

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copyOk.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copyOk.value = false
    }, 2500)
  } catch {
    copyOk.value = false
  }
}

const onPostLike = async () => {
  if (!post.value?._id) return
  if (!userStore.token) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  postLikeLoading.value = true
  try {
    const res = await togglePostLike(post.value._id)
    const d = res.data.data
    post.value.likedByMe = d.liked
    post.value.likeCount = d.likeCount
  } catch {
    // 401 由 request 拦截
  } finally {
    postLikeLoading.value = false
  }
}
</script>

<style scoped>
.post-page {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 0 1.25rem 1rem;
}
.post-article {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  margin-top: 0.5rem;
}
.post-article__cover {
  line-height: 0;
  max-height: 320px;
  overflow: hidden;
  background: #1e1e24;
}
.post-article__cover img {
  width: 100%;
  object-fit: cover;
  max-height: 360px;
}
.post-article__inner {
  max-width: var(--max-readable);
  margin: 0 auto;
  padding: 1.5rem 1.25rem 2rem;
}
.post-breadcrumb {
  font-size: 0.85rem;
  color: var(--color-ink-muted);
  margin: 0 0 1rem;
}
.post-breadcrumb a {
  color: var(--color-primary);
  font-weight: 500;
}
.post-breadcrumb .sep {
  margin: 0 0.4rem;
  opacity: 0.5;
}
.post-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--color-border);
}
.post-header__title {
  font-size: clamp(1.5rem, 3.5vw, 2.1rem);
  font-weight: 700;
  line-height: 1.25;
  color: var(--color-ink);
  margin: 0 0 0.75rem;
  letter-spacing: 0.04em;
}
.post-header__row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.post-header__meta {
  font-size: 0.9rem;
  color: var(--color-ink-muted);
  margin: 0;
  line-height: 1.5;
}
.post-header__meta .by {
  font-weight: 600;
  color: #3d3d45;
}
.post-category {
  margin: 0.35rem 0 0.5rem;
}
.post-category__link {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
}
.post-category__link:hover {
  color: var(--color-accent);
  text-decoration: underline;
}
.post-header__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.9rem;
}
.post-header__tags :deep(a) {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
.post-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem 1rem;
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid #eee4db;
}
.post-like {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  font-size: 0.95rem;
  font-family: inherit;
  font-weight: 600;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: #fff;
  color: #5c5c66;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.post-like:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.post-like:disabled {
  opacity: 0.6;
  cursor: wait;
}
.post-like--on {
  color: #b83232;
  border-color: #e8a0a0;
  background: #fff5f5;
}
.post-like__n {
  font-size: 0.88rem;
  font-weight: 600;
}
.post-like-tip {
  font-size: 0.85rem;
  color: var(--color-ink-muted);
}
.post-body {
  min-height: 4rem;
}
.post-toc {
  margin: 1rem 0 1.25rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: rgba(45, 74, 62, 0.05);
}
.post-toc__title {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-ink);
}
.post-toc__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.25rem;
}
.post-toc__item a {
  font-size: 0.9rem;
  color: var(--color-primary);
  text-decoration: none;
}
.post-toc__item a:hover {
  color: var(--color-accent);
  text-decoration: underline;
}
.post-body :deep(p:first-of-type) {
  margin-top: 0;
}
.copy-ok {
  font-size: 0.85rem;
  color: #0f5132;
  background: #d1e7dd;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  display: inline-block;
  margin: 0 0 0.5rem;
}
.related-posts {
  margin-top: 2rem;
  padding: 1rem 1.1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: #faf8f5;
}
.related-posts__title {
  font-size: 1.05rem;
  margin: 0 0 0.75rem;
  color: var(--color-ink);
}
.related-posts__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.65rem;
}
.related-posts__list a {
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
}
.related-posts__list a:hover {
  color: var(--color-accent);
  text-decoration: underline;
}
.related-posts__meta {
  display: block;
  font-size: 0.82rem;
  color: var(--color-ink-muted);
  margin-top: 0.15rem;
}
.state {
  text-align: center;
  padding: 3rem 1rem;
  max-width: 24rem;
  margin: 2rem auto;
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
}
.state--error {
  color: #6b2b2b;
  border-color: #f0c2c2;
  background: #fff5f5;
}
.state--error p {
  margin-bottom: 1.25rem;
  line-height: 1.6;
}
.state--load {
  text-align: left;
  max-width: var(--max-readable);
  border: 0;
  background: transparent;
  margin-top: 1.5rem;
}
.load-bar {
  border-radius: 8px;
  margin-bottom: 1rem;
}
</style>
