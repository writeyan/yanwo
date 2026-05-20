<template>
  <div class="favorites-page">
    <header class="favorites-head">
      <h1>我的收藏</h1>
      <p>已收藏 {{ posts.length }} 篇已发布文章</p>
    </header>

    <div v-if="loading" class="favorites-loading">
      <div v-for="n in 3" :key="n" class="card favorites-skeleton">
        <div class="skeleton" style="height: 1.1rem; width: 55%; margin-bottom: 0.75rem" />
        <div class="skeleton" style="height: 2.5rem" />
      </div>
    </div>

    <p v-else-if="!posts.length" class="favorites-empty">
      还没有收藏文章。在文章页点击「收藏」即可加入这里。
      <router-link to="/">去首页逛逛</router-link>
    </p>

    <ul v-else class="favorites-list">
      <li v-for="post in posts" :key="post._id" class="card favorites-item">
        <h2 class="favorites-item__title">
          <router-link :to="`/post/${post.slug}`">{{ post.title }}</router-link>
        </h2>
        <p class="favorites-item__meta">
          <span>{{ post.authorName }}</span>
          <span v-if="post.category?.name">· {{ post.category.name }}</span>
          <span>·</span>
          <time :datetime="post.publishedAt">{{ formatDate(post.publishedAt) }}</time>
          <span>· 阅读 {{ post.viewCount ?? 0 }}</span>
          <span>· ♥ {{ post.likeCount ?? 0 }}</span>
        </p>
        <p v-if="post.excerpt" class="favorites-item__excerpt">{{ post.excerpt }}</p>
        <button
          type="button"
          class="btn btn-ghost btn-sm favorites-item__unfav"
          :disabled="unfavId === post._id"
          @click="removeFavorite(post)"
        >
          {{ unfavId === post._id ? '处理中…' : '取消收藏' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
/** 当前用户收藏的文章列表 */
import { ref, onMounted } from 'vue'
import { getMyFavorites, togglePostFavorite } from '../api/post'

const loading = ref(true)
const posts = ref([])
const unfavId = ref(null)

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—')

const load = async () => {
  loading.value = true
  try {
    const res = await getMyFavorites()
    posts.value = res.data.data || []
  } catch {
    posts.value = []
  } finally {
    loading.value = false
  }
}

const removeFavorite = async (post) => {
  if (!post?._id) return
  unfavId.value = post._id
  try {
    await togglePostFavorite(post._id)
    posts.value = posts.value.filter((p) => p._id !== post._id)
  } catch {
    // 401 由 request 拦截
  } finally {
    unfavId.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.favorites-page {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 0 1.25rem 2.5rem;
}
.favorites-head {
  margin: 1.25rem 0 1.5rem;
}
.favorites-head h1 {
  font-size: 1.75rem;
  margin: 0 0 0.35rem;
  color: var(--color-ink);
}
.favorites-head p {
  margin: 0;
  color: var(--color-ink-muted);
  font-size: 0.95rem;
}
.favorites-loading {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.favorites-skeleton {
  padding: 1.25rem;
}
.favorites-empty {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--color-ink-muted);
  line-height: 1.6;
}
.favorites-empty a {
  display: inline-block;
  margin-top: 0.75rem;
  font-weight: 600;
  color: var(--color-primary);
}
.favorites-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.favorites-item {
  padding: 1.15rem 1.25rem;
}
.favorites-item__title {
  margin: 0 0 0.45rem;
  font-size: 1.15rem;
}
.favorites-item__title a {
  color: var(--color-ink);
  font-weight: 600;
}
.favorites-item__title a:hover {
  color: var(--color-primary);
}
.favorites-item__meta {
  margin: 0 0 0.5rem;
  font-size: 0.88rem;
  color: var(--color-ink-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
}
.favorites-item__excerpt {
  margin: 0 0 0.75rem;
  font-size: 0.92rem;
  color: var(--color-ink-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.favorites-item__unfav {
  margin-top: 0.25rem;
}
</style>
