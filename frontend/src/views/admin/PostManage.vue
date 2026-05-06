<template>
  <div class="admin-page">
    <header class="admin-page__head">
      <h1>{{ isAdmin ? '文章管理' : '我的文章' }}</h1>
      <p>{{ isAdmin ? '查看、删除全站文章（含草稿与已标记删除的条目）。' : '查看、编辑与删除你自己的文章（含草稿）。' }}</p>
    </header>

    <div class="toolbar">
      <router-link to="/create" class="btn btn-primary btn-sm">＋ 新建文章</router-link>
    </div>

    <div v-if="!posts.length" class="empty">暂无文章，或数据加载中失败。</div>
    <ul v-else class="table-list" aria-label="文章列表">
      <li v-for="post in posts" :key="post._id" class="table-list__row">
        <div class="table-list__main">
          <p class="table-list__title">{{ post.title }}</p>
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
            >预览</router-link
          >
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
import { ref, onMounted, computed } from 'vue'
import { getAdminPosts, getMyPosts, deletePost as deletePostApi } from '../../api/post'
import { useUserStore } from '../../store/user'

const posts = ref([])
const userStore = useUserStore()
const isAdmin = computed(() => userStore.userInfo?.role === 'admin')

const statusClass = (s) => {
  if (s === 'published') return 'badge-published'
  if (s === 'draft') return 'badge-draft'
  return 'badge-deleted'
}

onMounted(async () => {
  try {
    const res = isAdmin.value ? await getAdminPosts() : await getMyPosts()
    posts.value = res.data.data.posts
  } catch (err) {
    console.error('加载文章失败', err)
  }
})

const handleDeletePost = async (id) => {
  if (!confirm('确定要删除这篇文章吗？将标记为已删除。')) return
  try {
    await deletePostApi(id)
    await refresh()
  } catch (err) {
    alert('删除失败')
  }
}

const refresh = async () => {
  try {
    const res = isAdmin.value ? await getAdminPosts() : await getMyPosts()
    posts.value = res.data.data.posts
  } catch (e) {
    /* ignore */
  }
}
</script>

<style scoped>
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
  word-break: break-word;
}
.table-list__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  flex-shrink: 0;
}
</style>
