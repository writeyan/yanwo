<template>
  <div class="tag-archive container">
    <header class="tag-archive__intro">
      <h1>标签云</h1>
      <p class="tag-archive__desc">按标签浏览已发布的文章，点击标签回到首页并筛选。</p>
    </header>

    <div v-if="loading" class="tag-archive__loading">
      <div v-for="n in 12" :key="n" class="skeleton tag-skeleton" />
    </div>

    <p v-else-if="error" class="tag-archive__error">{{ error }}</p>

    <div v-else-if="tags.length === 0" class="tag-archive__empty">暂无标签，去写篇文章并加上标签吧。</div>

    <div v-else class="tag-grid">
      <button
        v-for="t in tags"
        :key="t.name"
        type="button"
        class="tag-tile"
        :style="{ fontSize: tagSize(t.count) }"
        @click="goFilter(t.name)"
      >
        <span class="tag-tile__name">#{{ t.name }}</span>
        <span class="tag-tile__count">{{ t.count }} 篇</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTagStats } from '../api/post'

const router = useRouter()
const tags = ref([])
const loading = ref(true)
const error = ref('')

const maxCount = ref(1)

onMounted(async () => {
  try {
    const res = await getTagStats()
    const list = res.data.data || []
    tags.value = list
    maxCount.value = Math.max(1, ...list.map((t) => t.count))
  } catch (e) {
    error.value = e.response?.data?.message || '标签加载失败'
  } finally {
    loading.value = false
  }
})

const tagSize = (c) => {
  const r = 0.85 + (0.4 * c) / maxCount.value
  return `clamp(0.85rem, ${r}rem, 1.1rem)`
}

const goFilter = (name) => {
  router.push({ path: '/', query: { tag: name } })
}
</script>

<style scoped>
.container {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 0 1.25rem;
}
.tag-archive__intro {
  text-align: center;
  margin: 2.5rem 0 2rem;
}
.tag-archive__intro h1 {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
  color: var(--color-ink);
}
.tag-archive__desc {
  color: var(--color-ink-muted);
  max-width: 32rem;
  margin: 0 auto;
  font-size: 0.95rem;
  line-height: 1.6;
}
.tag-archive__loading {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}
.tag-skeleton {
  width: 6rem;
  height: 2.5rem;
  border-radius: 999px;
}
.tag-archive__error {
  text-align: center;
  color: #b83232;
  padding: 2rem;
}
.tag-archive__empty {
  text-align: center;
  color: var(--color-ink-muted);
  padding: 2rem 1rem;
}
.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 0.5rem;
  justify-content: center;
  padding-bottom: 2rem;
  max-width: 900px;
  margin: 0 auto;
}
.tag-tile {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 0.55rem 1.1rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-bg-elevated);
  cursor: pointer;
  color: var(--color-primary);
  font-family: inherit;
  font-weight: 600;
  line-height: 1.2;
  box-shadow: var(--shadow-sm);
  transition: transform 0.15s, box-shadow 0.2s, background 0.2s, border-color 0.2s;
}
.tag-tile:hover {
  background: #fff;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.tag-tile__name {
  display: block;
  margin-bottom: 0.15rem;
}
.tag-tile__count {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--color-ink-muted);
}
</style>
