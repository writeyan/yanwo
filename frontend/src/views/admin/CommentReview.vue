<template>
  <div class="admin-page">
    <header class="admin-page__head">
      <h1>评论审核</h1>
      <p>审核游客评论：通过后在文章详情可见，标记垃圾则不展示。</p>
    </header>

    <p v-if="msg" :class="['msg', msgType === 'ok' ? 'msg-ok' : 'msg-err']">{{ msg }}</p>

    <div v-if="loading" class="empty">加载中...</div>
    <div v-else-if="!rows.length" class="empty">暂无待审核评论。</div>
    <ul v-else class="table-list">
      <li v-for="item in rows" :key="item._id" class="table-list__row">
        <div class="table-list__main">
          <p class="table-list__title">{{ item.authorName }}：{{ item.content }}</p>
          <p class="sub">
            <span>文章：{{ item.post?.title || '未知' }}</span>
            <span>时间：{{ format(item.createdAt) }}</span>
          </p>
        </div>
        <div class="table-list__actions">
          <button class="btn btn-primary btn-sm" @click="doReview(item._id, 'approve')">通过</button>
          <button class="btn btn-danger btn-sm" @click="doReview(item._id, 'spam')">垃圾</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
/** 评论审核：待审列表、通过或标为垃圾 */
import { onMounted, ref } from 'vue'
import { getPendingComments, reviewComment } from '../../api/comment'

const rows = ref([])
const loading = ref(false)
const msg = ref('')
const msgType = ref('ok')

const format = (d) => (d ? new Date(d).toLocaleString() : '—')

const load = async () => {
  loading.value = true
  try {
    const res = await getPendingComments()
    rows.value = res.data.data || []
  } catch (e) {
    msg.value = e.response?.data?.message || '加载失败'
    msgType.value = 'err'
  } finally {
    loading.value = false
  }
}

const doReview = async (id, action) => {
  try {
    await reviewComment(id, action)
    rows.value = rows.value.filter((r) => r._id !== id)
    msg.value = action === 'approve' ? '评论已通过' : '评论已标记垃圾'
    msgType.value = 'ok'
  } catch (e) {
    msg.value = e.response?.data?.message || '操作失败'
    msgType.value = 'err'
  }
}

onMounted(load)
</script>

<style scoped>
.admin-page { max-width: 980px; margin: 0 auto; }
.admin-page__head h1 { font-size: 1.5rem; margin: 0 0 0.4rem; font-weight: 700; color: var(--color-ink); letter-spacing: 0.04em; }
.admin-page__head p { margin: 0 0 1rem; color: var(--color-ink-muted); }
.msg { margin: 0 0 0.75rem; font-size: 0.9rem; }
.msg-ok { color: #2f855a; }
.msg-err { color: #c53030; }
.empty { text-align: center; color: var(--color-ink-muted); padding: 1.4rem; border: 1px dashed var(--color-border); border-radius: 10px; background: var(--color-bg-elevated); }
.table-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.6rem; }
.table-list__row { display: flex; justify-content: space-between; gap: 0.8rem; padding: 0.9rem; border: 1px solid var(--color-border); border-radius: 10px; background: var(--color-bg-elevated); align-items: center; }
.table-list__main { flex: 1; min-width: 0; }
.table-list__title { margin: 0 0 0.3rem; line-height: 1.5; }
.sub { margin: 0; display: flex; flex-wrap: wrap; gap: 0.8rem; color: var(--color-ink-muted); font-size: 0.84rem; }
.table-list__actions { display: flex; gap: 0.45rem; }
</style>
