<template>
  <div class="admin-page">
    <header class="admin-page__head">
      <h1>{{ isAdminPostsPage ? '文章管理' : '我的文章' }}</h1>
      <p>{{ isAdminPostsPage ? '查看、筛选、编辑或删除全站文章。' : '查看、编辑与删除你自己的文章（含草稿）。' }}</p>
    </header>

    <div class="toolbar">
      <router-link to="/create" class="btn btn-primary btn-sm">＋ 新建文章</router-link>
      <div v-if="isAdminPostsPage" class="status-filter">
        <label class="sr-only" for="status-filter">按状态筛选</label>
        <select id="status-filter" v-model="statusFilter" class="input-text input-text--narrow" @change="refresh">
          <option value="">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
          <option value="deleted">已删除</option>
        </select>
      </div>
    </div>

    <div v-if="!displayPosts.length" class="empty">暂无文章，或数据加载失败。</div>
    <ul v-else class="table-list" aria-label="文章列表">
      <li v-for="post in displayPosts" :key="post._id" class="table-list__row">
        <div class="table-list__main">
          <p class="table-list__title">{{ post.title }}</p>
          <span class="muted" v-if="post.category?.name">分类 {{ post.category.name }}</span>
          <span class="muted" v-if="isAdminPostsPage && post.author?.username">{{ post.author.username }}</span>
          <span :class="['badge', statusClass(post.status)]">{{ post.status }}</span>
        </div>
        <div class="table-list__actions">
          <router-link
            v-if="post.status !== 'deleted'"
            :to="`/edit/${post._id}`"
            class="btn btn-ghost btn-sm"
          >编辑</router-link>
          <router-link
            v-if="post.status === 'published' && post.slug"
            :to="`/post/${post.slug}`"
            class="btn btn-ghost btn-sm"
            target="_blank"
            >预览</router-link>
          <button
            v-if="post.status !== 'deleted'"
            type="button"
            class="btn btn-danger btn-sm"
            @click="handleDeletePost(post._id)"
          >
            删除
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getAdminPosts, getMyPosts, deletePost as deletePostApi } from '../../api/post'
import { useUserStore } from '../../store/user'

const route = useRoute()
const posts = ref([])
const statusFilter = ref('')
const userStore = useUserStore()

const isAdminPostsPage = computed(() => route.name === 'admin-posts')
const displayPosts = computed(() => posts.value)

const statusClass = (s) => {
  if (s === 'published') return 'badge-published'
  if (s === 'draft') return 'badge-draft'
  return 'badge-deleted'
}

const refresh = async () => {
  try {
    if (isAdminPostsPage.value) {
      const params = {}
      if (statusFilter.value) params.status = statusFilter.value
      const res = await getAdminPosts(params)
      posts.value = res.data.data.posts
    } else {
      const res = await getMyPosts()
      posts.value = res.data.data.posts
    }
  } catch (err) {
    console.error('加载文章失败', err)
    posts.value = []
  }
}

watch(
  () => route.fullPath,
  () => refresh()
)

onMounted(refresh)

const handleDeletePost = async (id) => {
  if (!confirm('确定要删除这篇文章吗？将标记为已删除。')) return
  try {
    await deletePostApi(id)
    await refresh()
  } catch (err) {
    alert('删除失败')
  }
}
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
.admin-page {
  max-width: 900px;
  margin: 0 auto;
}
.admin-page__head h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0 0 0.4rem;
  letter-spacing: 0.04em;
}
.admin-page__head p {
  margin: 0 0 1.25rem;
  color: var(--color-ink-muted);
  font-size: 0.95rem;
  line-height: 1.55;
}
.toolbar {
  margin-bottom: 1.25rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.status-filter .input-text--narrow {
  max-width: 11rem;
  padding: 0.35rem 0.6rem;
}
.muted {
  display: inline-block;
  margin-right: 0.65rem;
  font-size: 0.82rem;
  color: var(--color-ink-muted);
}
.empty {
  text-align: center;
  color: var(--color-ink-muted);
  padding: 2rem 1rem;
  background: var(--color-bg);
  border: 1px dashed var(--color-border);
  border-radius: 10px;
  font-size: 0.95rem;
}
.table-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.table-list__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  padding: 0.9rem 1rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  transition: border-color 0.2s;
}
.table-list__row:hover {
  border-color: var(--color-primary);
}
.table-list__main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  min-width: 0;
  flex: 1;
}
.table-list__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-ink);
  min-width: 0;
  width: 100%;
  word-break: break-word;
}
.table-list__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  flex-shrink: 0;
}
</style>
