<template>
  <div class="archive-page">
    <header class="archive-head">
      <h1>归档</h1>
      <p>按时间整理全部已发布文章，仅展示基础信息。</p>
      <p class="archive-total">共 {{ total }} 篇</p>
    </header>

    <div v-if="loading" class="archive-loading">
      <div v-for="n in 3" :key="n" class="card archive-skeleton">
        <div class="skeleton" style="height: 1.1rem; width: 35%; margin-bottom: 0.8rem" />
        <div class="skeleton" style="height: 2.6rem" />
      </div>
    </div>

    <p v-else-if="!groups.length" class="archive-empty">暂无可归档文章。</p>

    <section v-else class="archive-groups">
      <article v-for="g in groups" :key="g.key" class="card archive-group">
        <h2>{{ g.year }} 年 {{ Number(g.month) }} 月</h2>
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
import { onMounted, ref } from 'vue'
import { getArchive } from '../api/post'

const loading = ref(true)
const total = ref(0)
const groups = ref([])

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—')

onMounted(async () => {
  loading.value = true
  try {
    const res = await getArchive()
    total.value = res.data.data.total || 0
    groups.value = res.data.data.archive || []
  } catch {
    groups.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.archive-page { max-width: 980px; margin: 0 auto; padding: 0 1.25rem 2rem; }
.archive-head { margin: 1.8rem 0 1rem; }
.archive-head h1 { margin: 0 0 0.35rem; font-size: 1.9rem; color: var(--color-ink); }
.archive-head p { margin: 0; color: var(--color-ink-muted); }
.archive-total { margin-top: 0.5rem !important; font-size: 0.92rem; }
.archive-loading { display: grid; gap: 0.8rem; }
.archive-skeleton { padding: 1rem; }
.archive-empty { text-align: center; color: var(--color-ink-muted); padding: 2rem 1rem; }
.archive-groups { display: grid; gap: 0.9rem; }
.archive-group { padding: 1rem; }
.archive-group h2 { margin: 0 0 0.7rem; font-size: 1.05rem; color: var(--color-ink); }
.archive-list { list-style: none; padding: 0; margin: 0; }
.archive-item { padding: 0.55rem 0; border-top: 1px dashed var(--color-border); }
.archive-item:first-child { border-top: none; padding-top: 0; }
.archive-title { color: var(--color-ink); font-weight: 600; text-decoration: none; }
.archive-title:hover { color: var(--color-accent); }
.archive-meta { margin-top: 0.2rem; display: flex; flex-wrap: wrap; gap: 0.7rem; color: var(--color-ink-muted); font-size: 0.83rem; }
</style>
