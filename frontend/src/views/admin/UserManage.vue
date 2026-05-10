<template>
  <div class="admin-page">
    <header class="admin-page__head">
      <h1>用户管理</h1>
      <p>搜索用户并调整角色或账号状态。</p>
    </header>

    <form class="toolbar" @submit.prevent="reload">
      <input v-model="q" type="search" class="input-text" placeholder="按用户名或邮箱搜索" />
      <button type="submit" class="btn btn-primary btn-sm">查找</button>
    </form>

    <p v-if="err" class="err">{{ err }}</p>

    <ul v-if="users.length" class="table-list">
      <li v-for="u in users" :key="u._id" class="table-list__row">
        <div class="main">
          <strong>{{ u.username }}</strong>
          <span class="meta">{{ u.email }}</span>
          <span class="badge">{{ u.role }}</span>
          <span :class="['badge', u.status === 'active' ? 'ok' : 'bad']">{{ u.status }}</span>
        </div>
        <div class="actions">
          <select class="input-text sel" :value="u.role" @change="onRole(u, $event)">
            <option value="reader">reader</option>
            <option value="author">author</option>
            <option value="admin">admin</option>
          </select>
          <button
            v-if="u.status === 'active'"
            type="button"
            class="btn btn-danger btn-sm"
            @click="toggleStatus(u, 'disabled')"
          >
            禁用
          </button>
          <button
            v-else
            type="button"
            class="btn btn-ghost btn-sm"
            @click="toggleStatus(u, 'active')"
          >
            解禁
          </button>
        </div>
      </li>
    </ul>
    <p v-else-if="loaded" class="empty">没有找到用户。</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listUsersAdmin, patchUserAdmin } from '../../api/users'

const q = ref('')
const users = ref([])
const err = ref('')
const loaded = ref(false)

const reload = async () => {
  err.value = ''
  loaded.value = false
  try {
    const res = await listUsersAdmin({ q: q.value.trim() || undefined })
    users.value = res.data.data.users || []
  } catch (e) {
    err.value = e.response?.data?.message || '加载失败'
    users.value = []
  } finally {
    loaded.value = true
  }
}

const onRole = async (user, ev) => {
  const role = ev.target.value
  if (!role || role === user.role) return
  if (!confirm(`将「${user.username}」设为 ${role}？`)) {
    ev.target.value = user.role
    return
  }
  try {
    await patchUserAdmin(user._id, { role })
    user.role = role
  } catch (e) {
    alert(e.response?.data?.message || '更新失败')
    ev.target.value = user.role
  }
}

const toggleStatus = async (user, status) => {
  if (!confirm(status === 'disabled' ? '确定禁用该用户？' : '确定解禁？')) return
  try {
    await patchUserAdmin(user._id, { status })
    user.status = status
  } catch (e) {
    alert(e.response?.data?.message || '操作失败')
  }
}

onMounted(reload)
</script>

<style scoped>
.admin-page {
  max-width: 920px;
  margin: 0 auto;
}
.admin-page__head h1 {
  font-size: 1.5rem;
  margin: 0 0 0.35rem;
  color: var(--color-ink);
}
.admin-page__head p {
  margin: 0 0 1rem;
  color: var(--color-ink-muted);
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.toolbar .input-text {
  flex: 1;
  min-width: 200px;
}
.err {
  color: #b83232;
  font-size: 0.9rem;
}
.table-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.5rem;
}
.table-list__row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-elevated);
}
.main {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.75rem;
}
.meta {
  font-size: 0.85rem;
  color: var(--color-ink-muted);
}
.badge {
  font-size: 0.72rem;
  padding: 0.15em 0.45em;
  border-radius: 4px;
  background: rgba(45, 74, 62, 0.1);
  color: var(--color-ink-muted);
}
.badge.ok {
  background: rgba(15, 81, 50, 0.12);
  color: var(--color-primary);
}
.badge.bad {
  background: rgba(184, 50, 50, 0.12);
  color: #b83232;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}
.sel {
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
  max-width: 8rem;
}
.empty {
  text-align: center;
  padding: 2rem;
  color: var(--color-ink-muted);
}
</style>
