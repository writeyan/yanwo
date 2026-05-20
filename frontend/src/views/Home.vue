<template>
  <div class="home">
    <section class="home-hero">
      <h1 class="home-hero__title">字句之间，<span>自有天地</span></h1>
      <p class="home-hero__lead">阅读、写作、评论——在这里整理想法与长文。</p>
      <form class="home-hero__search" @submit.prevent="onHeroSearch" role="search" aria-label="在首页内搜索">
        <input
          v-model="heroQ"
          type="search"
          class="input-text"
          placeholder="在已发布文章中搜索…"
        />
        <button type="submit" class="btn btn-primary">搜索</button>
      </form>
    </section>

    <div class="home-toolbar">
      <label class="home-toolbar__label" for="cat-select">分类</label>
      <select id="cat-select" v-model="categorySelect" class="input-text home-toolbar__select home-toolbar__select--cat" @change="onCategoryChange">
        <option value="">全部分类</option>
        <option v-for="c in categories" :key="c._id" :value="c.slug">{{ c.name }}</option>
      </select>
      <label class="home-toolbar__label" for="sort-select">排序</label>
      <select id="sort-select" v-model="sortSelect" class="input-text home-toolbar__select" @change="onSortChange">
        <option value="latest">最新发布</option>
        <option value="popular">最多点赞</option>
        <option value="views">最多阅读</option>
      </select>
    </div>

    <div v-if="hasFilters" class="filter-bar">
      <span>筛选中：</span>
      <span v-if="activeQ" class="filter-chip"
        >关键词「<strong>{{ activeQ }}</strong>」</span
      >
      <span v-if="activeCatName" class="filter-chip">分类 <strong>{{ activeCatName }}</strong></span>
      <span v-if="activeTag" class="filter-chip"
        >标签 <strong>#{{ activeTag }}</strong></span
      >
      <button type="button" class="btn btn-ghost btn-sm" @click="clearFilters">清除</button>
    </div>

    <div v-if="loading" class="post-skeletons">
      <div v-for="n in 3" :key="n" class="card post-card post-card--skeleton">
        <div class="skeleton" style="height: 1.1rem; width: 60%; margin-bottom: 1rem" />
        <div class="skeleton" style="height: 0.8rem; width: 40%; margin-bottom: 0.5rem" />
        <div class="skeleton" style="height: 3rem" />
      </div>
    </div>

    <p v-else-if="!posts.length" class="empty-state">没有符合条件的文章，试试更换关键词、分类或标签。</p>

    <div v-else class="post-list">
      <article
        v-for="post in posts"
        :key="post._id"
        class="card post-card"
        :class="{ 'post-card--row': !!post.featuredImage }"
      >
        <div v-if="post.featuredImage" class="post-card__media">
          <img :src="post.featuredImage" alt="" class="post-card__img" />
        </div>
        <div class="post-card__body">
          <h2 class="post-card__title">
            <router-link :to="`/post/${post.slug}`">{{ post.title }}</router-link>
          </h2>
          <p class="post-card__meta">
            <span>{{ post.authorName }}</span>
            <span v-if="post.category?.name">· {{ post.category.name }}</span>
            <span>·</span>
            <time :datetime="post.publishedAt">{{ formatDate(post.publishedAt) }}</time>
            <span>·</span>
            <span>{{ post.viewCount }} 次阅读</span>
          </p>
          <div v-if="post.tags?.length" class="post-card__tags">
            <button
              v-for="t in post.tags"
              :key="t"
              type="button"
              class="tag-pill"
              @click="goTag(t)"
            >
              #{{ t }}
            </button>
          </div>
          <p class="post-card__excerpt">{{ excerptText(post) }}</p>
        </div>
      </article>
    </div>

    <div v-if="!loading && totalPages > 1" class="pagination">
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        :disabled="page === 1"
        @click="changePage(page - 1)"
      >
        上一页
      </button>
      <span>第 {{ page }} / {{ totalPages }} 页</span>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        :disabled="page === totalPages"
        @click="changePage(page + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup>
/** 首页：文章列表、分类筛选、排序与分页 */
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPosts } from '../api/post'
import { getCategories } from '../api/category'

const route = useRoute()
const router = useRouter()
const posts = ref([])
const page = ref(1)
const totalPages = ref(1)
const loading = ref(true)
const heroQ = ref('')
const categories = ref([])
const categorySelect = ref('')

const activeQ = computed(() => (route.query.q ? String(route.query.q) : ''))
const activeTag = computed(() => (route.query.tag ? String(route.query.tag) : ''))
const activeCategorySlug = computed(() =>
  route.query.category ? String(route.query.category).trim() : ''
)

const activeCatName = computed(() => {
  const slug = activeCategorySlug.value
  if (!slug) return ''
  const hit = categories.value.find((c) => c.slug === slug)
  return hit ? hit.name : slug
})

const activeSort = computed(() => {
  const s = route.query.sort ? String(route.query.sort) : 'latest'
  if (['popular', 'views'].includes(s)) return s
  return 'latest'
})
const sortSelect = ref('latest')
const hasFilters = computed(() => !!activeQ.value || !!activeTag.value || !!activeCategorySlug.value)

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—')
const stripHtml = (h) => (h || '').replace(/<[^>]*>/g, '')

const excerptText = (post) => {
  const raw = post.excerpt || stripHtml(post.content) || ''
  return raw.length > 160 ? `${raw.slice(0, 160)}…` : raw
}

const syncToolbarFromRoute = () => {
  heroQ.value = activeQ.value
  sortSelect.value = activeSort.value
  categorySelect.value = activeCategorySlug.value || ''
}

const fetchPosts = async () => {
  loading.value = true
  try {
    const res = await getPosts({
      page: page.value,
      limit: 10,
      q: activeQ.value || undefined,
      tag: activeTag.value || undefined,
      category: activeCategorySlug.value || undefined,
      sort: activeSort.value,
    })
    posts.value = res.data.data.posts
    totalPages.value = res.data.data.pages
  } catch {
    posts.value = []
  } finally {
    loading.value = false
  }
}

const onSortChange = () => {
  const q = { ...route.query }
  if (sortSelect.value === 'latest') delete q.sort
  else q.sort = sortSelect.value
  router.push({ path: '/', query: q })
}

const onCategoryChange = () => {
  const q = { ...route.query }
  if (categorySelect.value) q.category = categorySelect.value
  else delete q.category
  router.push({ path: '/', query: q })
}

onMounted(async () => {
  try {
    const res = await getCategories()
    categories.value = res.data.data || []
  } catch {
    categories.value = []
  }
  syncToolbarFromRoute()
  fetchPosts()
})

watch(
  () => [route.query.q, route.query.tag, route.query.sort, route.query.category],
  () => {
    page.value = 1
    syncToolbarFromRoute()
    fetchPosts()
  }
)

const changePage = (n) => {
  page.value = n
  fetchPosts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const onHeroSearch = () => {
  const qtrim = heroQ.value.trim()
  const q = { ...route.query }
  if (qtrim) q.q = qtrim
  else delete q.q
  if (route.query.tag) q.tag = String(route.query.tag)
  if (route.query.category) q.category = String(route.query.category)
  if (activeSort.value !== 'latest') q.sort = activeSort.value
  router.push({ path: '/', query: q })
}

const goTag = (t) => {
  const qy = { tag: t }
  if (activeQ.value) qy.q = activeQ.value
  if (activeCategorySlug.value) qy.category = activeCategorySlug.value
  if (activeSort.value !== 'latest') qy.sort = activeSort.value
  router.push({ path: '/', query: qy })
}

const clearFilters = () => {
  heroQ.value = ''
  categorySelect.value = ''
  const q = {}
  if (activeSort.value !== 'latest') q.sort = activeSort.value
  router.push({ path: '/', query: Object.keys(q).length ? q : {} })
}
</script>

<style scoped>
.home {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 0 1.25rem;
}
.home-hero {
  text-align: center;
  padding: 2.5rem 0 1.5rem;
  max-width: 40rem;
  margin: 0 auto 1rem;
}
.home-hero__title {
  font-size: clamp(1.6rem, 3.5vw, 2.15rem);
  font-weight: 700;
  color: var(--color-ink);
  letter-spacing: 0.08em;
  line-height: 1.3;
  margin-bottom: 0.75rem;
}
.home-hero__title span {
  color: var(--color-primary);
}
.home-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  max-width: var(--max-content);
}
.home-toolbar__label {
  font-size: 0.88rem;
  color: var(--color-ink-muted);
  font-weight: 600;
}
.home-toolbar__select {
  max-width: 11rem;
  padding: 0.35rem 0.6rem;
  font-size: 0.9rem;
}
.home-toolbar__select--cat {
  max-width: 14rem;
}
.home-hero__lead {
  color: var(--color-ink-muted);
  font-size: 1.05rem;
  margin-bottom: 1.5rem;
  line-height: 1.65;
}
.home-hero__search {
  display: flex;
  gap: 0.5rem;
  max-width: 32rem;
  margin: 0 auto;
  flex-wrap: wrap;
  justify-content: center;
}
.home-hero__search .input-text {
  flex: 1;
  min-width: 0;
  max-width: 20rem;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.75rem;
  padding: 0.6rem 1rem;
  margin-bottom: 1.25rem;
  background: rgba(45, 74, 62, 0.06);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  color: var(--color-ink-muted);
  font-size: 0.9rem;
}
.filter-chip {
  color: var(--color-ink);
}
.post-skeletons {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.post-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.post-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: box-shadow 0.25s, border-color 0.25s, transform 0.2s;
}
@media (min-width: 640px) {
  .post-card--row {
    flex-direction: row;
  }
}
.post-card:hover {
  box-shadow: var(--shadow-md);
  border-color: #d0c4b4;
  transform: translateY(-1px);
}
.post-card--skeleton {
  padding: 1.25rem;
  pointer-events: none;
}
.post-card__media {
  flex: 0 0 200px;
  min-height: 120px;
  max-height: 200px;
  background: #e8e4de;
}
.post-card__img {
  width: 100%;
  height: 100%;
  min-height: 120px;
  object-fit: cover;
  display: block;
}
.post-card__body {
  padding: 1.25rem 1.4rem 1.35rem;
  flex: 1;
  min-width: 0;
}
.post-card__title {
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.4;
  margin: 0 0 0.5rem;
}
.post-card__title a {
  color: var(--color-ink);
  text-decoration: none;
  transition: color 0.2s;
}
.post-card__title a:hover {
  color: var(--color-accent);
}
.post-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
  font-size: 0.85rem;
  color: var(--color-ink-muted);
  margin: 0 0 0.5rem;
}
.post-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0.35rem 0 0.6rem;
}
.post-card__excerpt {
  color: #4a4a55;
  font-size: 0.95rem;
  line-height: 1.7;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.empty-state {
  text-align: center;
  color: var(--color-ink-muted);
  padding: 3rem 1rem;
  background: var(--color-bg-elevated);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
}
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.25rem;
  margin: 2.5rem 0 1rem;
  font-size: 0.9rem;
  color: var(--color-ink-muted);
}
</style>
