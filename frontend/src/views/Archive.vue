<template>
  <div class="archive-page">
    <header class="archive-head">
      <h1>归档</h1>
      <p>按年份浏览全部已发布文章。</p>
      <p class="archive-total">共 {{ total }} 篇</p>
    </header>

    <div v-if="loading" class="archive-loading">
      <div v-for="n in 3" :key="n" class="card archive-skeleton">
        <div class="skeleton" style="height: 1.1rem; width: 35%; margin-bottom: 0.8rem" />
        <div class="skeleton" style="height: 2.6rem" />
      </div>
    </div>

    <p v-else-if="!yearGroups.length" class="archive-empty">暂无可归档文章。</p>

    <nav v-else class="year-nav" aria-label="按年份筛选">
      <span class="year-nav__label">年份：</span>
      <router-link :to="{ name: 'archive' }" class="chip" :class="{ 'chip--on': !yearParam }">全部</router-link>
      <router-link
        v-for="g in yearsOnly"
        :key="String(g.year)"
        :to="{ name: 'archive', query: { year: String(g.year) === '未知' ? 'unknown' : g.year } }"
        class="chip"
        :class="{ 'chip--on': isYearActive(g.year) }"
      >
        {{ formatYearLabel(g.year) }}
      </router-link>
    </nav>

    <section class="archive-groups">
      <article v-for="g in visibleYears" :key="g.year" class="card archive-group">
        <h2>{{ formatYearLabel(g.year) }}</h2>
        <ul class="archive-list">
          <li v-for="post in g.posts" :key="post._id" class="archive-item">
            <router-link :to="`/post/${post.slug}`" class="archive-title">{{ post.title }}</router-link>
            <div class="archive-meta">
              <time :datetime="post.publishedAt">{{ formatDate(post.publishedAt) }}</time>
              <span>阅读 {{ post.viewCount }}</span>
              <span>赞 {{ post.likeCount }}</span>
              <span>评 {{ post.commentCount }}</span>
            </div>
          </li>
        </ul>
      </article>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getArchive } from '../api/post'

const route = useRoute()
const loading = ref(true)
const total = ref(0)
const yearGroups = ref([])

const yearParam = computed(() => {
  const y = route.query.year
  if (y === undefined || y === null || String(y).trim() === '') return ''
  return String(y).trim()
})

const isYearActive = (gYear) => {
  const qp = yearParam.value
  if (!qp) return false
  if (qp === 'unknown') return String(gYear) === '未知'
  return String(gYear) === qp
}

const yearsOnly = computed(() => [...yearGroups.value].sort((a, b) => {
  if (a.year === '未知') return 1
  if (b.year === '未知') return -1
  return Number(b.year) - Number(a.year)
}))

const visibleYears = computed(() => {
  if (!yearGroups.value.length) return []
  if (!yearParam.value) return yearsOnly.value
  if (yearParam.value === 'unknown') return yearGroups.value.filter((x) => x.year === '未知')
  const yNum = Number(yearParam.value)
  if (!Number.isNaN(yNum)) {
    const hit = yearGroups.value.find((x) => String(x.year) === String(yNum))
    return hit ? [hit] : []
  }
  return yearGroups.value.filter((x) => String(x.year) === yearParam.value)
})

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—')
const formatYearLabel = (y) => (y === '未知' || y === 0 ? '未知年份' : `${y} 年`)

const load = async () => {
  loading.value = true
  try {
    const res = await getArchive()
    total.value = res.data.data.total || 0
    yearGroups.value = res.data.data.byYear || []
  } catch {
    yearGroups.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.archive-page {
  max-width: 980px;
  margin: 0 auto;
  padding: 0 1.25rem 2rem;
}
.archive-head {
  margin: 1.8rem 0 1rem;
}
.archive-head h1 {
  margin: 0 0 0.35rem;
  font-size: 1.9rem;
  color: var(--color-ink);
}
.archive-head p {
  margin: 0;
  color: var(--color-ink-muted);
}
.archive-total {
  margin-top: 0.5rem !important;
  font-size: 0.92rem;
}
.year-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  margin-bottom: 1.1rem;
  font-size: 0.88rem;
  color: var(--color-ink-muted);
}
.year-nav__label {
  font-weight: 600;
  margin-right: 0.25rem;
}
.chip {
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  color: var(--color-primary);
  text-decoration: none;
  transition: border-color 0.2s, background 0.2s;
}
.chip:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.chip--on {
  background: rgba(45, 74, 62, 0.1);
  border-color: var(--color-primary);
  font-weight: 600;
  color: var(--color-ink);
}
.archive-loading {
  display: grid;
  gap: 0.8rem;
}
.archive-skeleton {
  padding: 1rem;
}
.archive-empty {
  text-align: center;
  color: var(--color-ink-muted);
  padding: 2rem 1rem;
}
.archive-groups {
  display: grid;
  gap: 0.9rem;
}
.archive-group {
  padding: 1rem;
}
.archive-group h2 {
  margin: 0 0 0.7rem;
  font-size: 1.1rem;
  color: var(--color-ink);
}
.archive-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.archive-item {
  padding: 0.55rem 0;
  border-top: 1px dashed var(--color-border);
}
.archive-item:first-child {
  border-top: none;
  padding-top: 0;
}
.archive-title {
  color: var(--color-ink);
  font-weight: 600;
  text-decoration: none;
}
.archive-title:hover {
  color: var(--color-accent);
}
.archive-meta {
  margin-top: 0.2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  color: var(--color-ink-muted);
  font-size: 0.83rem;
}
</style>
