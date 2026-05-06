<template>
  <div class="page-create">
    <div class="page-create__head">
      <h1>编辑文章</h1>
      <p class="page-create__hint">可继续完善草稿，或直接修改已发布内容。</p>
    </div>

    <form class="form-card" @submit.prevent="submitPost">
      <div class="form-group">
        <label class="label" for="title">标题 *</label>
        <input id="title" v-model="form.title" class="input-text" type="text" required placeholder="给文章一个清晰的标题" />
      </div>
      <div class="form-group form-group--grow">
        <label class="label" for="content">正文 *（Markdown）</label>
        <textarea
          id="content"
          v-model="form.content"
          class="input-text"
          rows="16"
          required
          placeholder="在此编写 Markdown 内容…"
        />
      </div>
      <div class="form-row">
        <div class="form-group form-group--half">
          <label class="label" for="tags">标签</label>
          <input id="tags" v-model="form.tagsStr" class="input-text" type="text" placeholder="技术, 生活, 随笔" />
        </div>
        <div class="form-group form-group--half">
          <label class="label" for="img">封面图 URL</label>
          <input id="img" v-model="form.featuredImage" class="input-text" type="url" placeholder="https://" />
        </div>
      </div>
      <div class="form-group form-group--status">
        <label class="label" for="status">发布</label>
        <select id="status" v-model="form.status" class="input-text select">
          <option value="draft">存为草稿</option>
          <option value="published">发布</option>
        </select>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '保存中…' : '保存修改' }}
        </button>
        <button type="button" class="btn btn-ghost" :disabled="loading" @click="goBack">返回</button>
      </div>
    </form>

    <section v-if="revisions.length" class="revision-panel card">
      <h2 class="revision-panel__title">最近修订记录</h2>
      <p class="revision-panel__hint">每次保存修改时会自动生成一条副本（最多保留近期若干条）。</p>
      <ul class="revision-list">
        <li v-for="r in revisions" :key="r._id" class="revision-item">
          <span class="revision-item__time">{{ formatRevTime(r.createdAt) }}</span>
          <span class="revision-item__by">{{ r.editedBy?.username || r.editedByName || '作者' }}</span>
          <details class="revision-details">
            <summary>查看该版本正文摘要</summary>
            <pre class="revision-pre">{{ snippet(r.content) }}</pre>
          </details>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPostByIdForEdit, updatePost, getPostRevisions } from '../api/post'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const revisions = ref([])
const form = reactive({
  title: '',
  content: '',
  tagsStr: '',
  featuredImage: '',
  status: 'draft',
})

const formatRevTime = (d) => (d ? new Date(d).toLocaleString() : '—')
const snippet = (text) => {
  const t = String(text || '').replace(/\s+/g, ' ').trim()
  return t.length > 480 ? `${t.slice(0, 480)}…` : t
}

const load = async () => {
  loading.value = true
  try {
    const res = await getPostByIdForEdit(route.params.id)
    const p = res.data.data
    form.title = p.title || ''
    form.content = p.content || ''
    form.tagsStr = Array.isArray(p.tags) ? p.tags.join(', ') : ''
    form.featuredImage = p.featuredImage || ''
    form.status = p.status || 'draft'
    try {
      const revRes = await getPostRevisions(route.params.id)
      revisions.value = revRes.data.data?.revisions || []
    } catch {
      revisions.value = []
    }
  } catch (err) {
    alert(err.response?.data?.message || '加载失败')
    router.push('/admin/posts')
  } finally {
    loading.value = false
  }
}

const submitPost = async () => {
  loading.value = true
  try {
    await updatePost(route.params.id, {
      title: form.title,
      content: form.content,
      tags: form.tagsStr
        ? form.tagsStr
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      featuredImage: form.featuredImage || undefined,
      status: form.status,
    })
    alert('保存成功')
    router.push('/admin/posts')
  } catch (err) {
    alert(err.response?.data?.message || '保存失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => router.back()

onMounted(load)
</script>

<style scoped>
.page-create { max-width: 820px; margin: 0 auto; padding: 0 1.25rem 2.5rem; }
.page-create__head { text-align: center; margin: 2rem 0 1.75rem; }
.page-create__head h1 { font-size: 1.85rem; font-weight: 700; letter-spacing: 0.06em; margin-bottom: 0.5rem; color: var(--color-ink); }
.page-create__hint { color: var(--color-ink-muted); font-size: 0.95rem; max-width: 28rem; margin: 0 auto; line-height: 1.6; }
.form-card { background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-radius: var(--radius); box-shadow: var(--shadow-sm); padding: 1.5rem 1.35rem 1.6rem; }
.form-group { margin-bottom: 1.15rem; }
.form-group--grow textarea { font-family: ui-monospace, 'Cascadia Code', 'Source Han Sans SC', 'Consolas', monospace; font-size: 0.9rem; line-height: 1.6; resize: vertical; min-height: 12rem; }
.form-row { display: flex; flex-direction: column; gap: 0; }
@media (min-width: 640px) { .form-row { flex-direction: row; gap: 1rem; } .form-group--half { flex: 1; min-width: 0; } }
.form-group--status { max-width: 14rem; }
.select { cursor: pointer; appearance: auto; background: var(--color-bg-elevated); }
.form-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border); }
.revision-panel { margin-top: 1.75rem; padding: 1.25rem 1.35rem; background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-radius: var(--radius); }
.revision-panel__title { font-size: 1.1rem; margin: 0 0 0.35rem; color: var(--color-ink); }
.revision-panel__hint { font-size: 0.88rem; color: var(--color-ink-muted); margin: 0 0 1rem; line-height: 1.5; }
.revision-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 1rem; }
.revision-item { padding-bottom: 0.75rem; border-bottom: 1px dashed var(--color-border); }
.revision-item:last-child { border-bottom: 0; padding-bottom: 0; }
.revision-item__time { font-size: 0.85rem; color: var(--color-ink-muted); margin-right: 0.5rem; }
.revision-item__by { font-size: 0.85rem; font-weight: 600; color: var(--color-primary); }
.revision-details { margin-top: 0.45rem; font-size: 0.88rem; }
.revision-details summary { cursor: pointer; color: var(--color-accent); font-weight: 500; }
.revision-pre { margin: 0.5rem 0 0; padding: 0.65rem 0.75rem; background: #f6f3ee; border-radius: 8px; font-size: 0.82rem; white-space: pre-wrap; word-break: break-word; max-height: 14rem; overflow: auto; }
</style>
