<template>
  <div class="page-create">
    <div class="page-create__head">
      <h1>写文章</h1>
      <p class="page-create__hint">使用 Markdown 书写正文，标签有助于读者发现内容。</p>
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
          <input
            id="tags"
            v-model="form.tagsStr"
            class="input-text"
            type="text"
            placeholder="技术, 生活, 随笔"
          />
        </div>
        <div class="form-group form-group--half">
          <label class="label" for="img">封面图 URL</label>
          <input
            id="img"
            v-model="form.featuredImage"
            class="input-text"
            type="url"
            placeholder="https://"
          />
        </div>
      </div>
      <div class="form-group form-group--status">
        <label class="label" for="status">发布</label>
        <select id="status" v-model="form.status" class="input-text select">
          <option value="draft">存为草稿</option>
          <option value="published">立即发布</option>
        </select>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '提交中…' : '保存' }}
        </button>
        <button type="button" class="btn btn-ghost" :disabled="loading" @click="goHome">返回首页</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createPost } from '../api/post'

const router = useRouter()
const loading = ref(false)

const form = reactive({
  title: '',
  content: '',
  tagsStr: '',
  featuredImage: '',
  status: 'published',
})

const goHome = () => {
  if (loading.value) return
  router.push('/')
}

const submitPost = async () => {
  loading.value = true
  const data = {
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
  }
  try {
    await createPost(data)
    router.push('/')
  } catch (err) {
    alert(err.response?.data?.message || '发布失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page-create {
  max-width: 820px;
  margin: 0 auto;
  padding: 0 1.25rem 2.5rem;
}
.page-create__head {
  text-align: center;
  margin: 2rem 0 1.75rem;
}
.page-create__head h1 {
  font-size: 1.85rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
  color: var(--color-ink);
}
.page-create__hint {
  color: var(--color-ink-muted);
  font-size: 0.95rem;
  max-width: 28rem;
  margin: 0 auto;
  line-height: 1.6;
}
.form-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 1.5rem 1.35rem 1.6rem;
}
.form-group {
  margin-bottom: 1.15rem;
}
.form-group--grow textarea {
  font-family: ui-monospace, 'Cascadia Code', 'Source Han Sans SC', 'Consolas', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  resize: vertical;
  min-height: 12rem;
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: 0;
}
@media (min-width: 640px) {
  .form-row {
    flex-direction: row;
    gap: 1rem;
  }
  .form-group--half {
    flex: 1;
    min-width: 0;
  }
}
.form-group--status {
  max-width: 14rem;
}
.select {
  cursor: pointer;
  appearance: auto;
  background: var(--color-bg-elevated);
}
.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
</style>
