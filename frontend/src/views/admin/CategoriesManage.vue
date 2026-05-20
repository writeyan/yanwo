<template>
  <div class="admin-page">
    <header class="admin-page__head">
      <h1>分类管理</h1>
      <p>为文章归档与筛选维护分类列表。</p>
    </header>

    <form class="card add-form" @submit.prevent="handleCreate">
      <h3>新建分类</h3>
      <div class="row">
        <input v-model="newName" type="text" class="input-text" placeholder="分类名称 *" maxlength="48" />
        <input v-model="newDesc" type="text" class="input-text" placeholder="说明（可选）" maxlength="200" />
        <button type="submit" class="btn btn-primary btn-sm" :disabled="creating">保存</button>
      </div>
      <p v-if="flash" class="flash">{{ flash }}</p>
    </form>

    <ul v-if="list.length" class="table-list" aria-label="分类列表">
      <li v-for="c in list" :key="c._id" class="table-list__row">
        <template v-if="editing === c._id">
          <div class="table-list__main">
            <input v-model="editForm.name" class="input-text" maxlength="48" />
            <input v-model="editForm.description" class="input-text desc" maxlength="200" />
          </div>
          <div class="table-list__actions">
            <button type="button" class="btn btn-primary btn-sm" @click="saveEdit(c._id)">保存</button>
            <button type="button" class="btn btn-ghost btn-sm" @click="editing = null">取消</button>
          </div>
        </template>
        <template v-else>
          <div class="table-list__main">
            <p class="table-list__title">{{ c.name }}</p>
            <span class="sub">slug：{{ c.slug }}</span>
            <span v-if="c.description" class="sub">{{ c.description }}</span>
          </div>
          <div class="table-list__actions">
            <button type="button" class="btn btn-ghost btn-sm" @click="startEdit(c)">编辑</button>
            <button type="button" class="btn btn-danger btn-sm" @click="removeCat(c._id)">删除</button>
          </div>
        </template>
      </li>
    </ul>
    <p v-else class="empty">暂无分类。</p>
  </div>
</template>

<script setup>
/** 分类管理：CRUD 与表格编辑 */
import { ref, onMounted, reactive } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/category'

const list = ref([])
const flash = ref('')
const creating = ref(false)
const editing = ref(null)
const newName = ref('')
const newDesc = ref('')
const editForm = reactive({ name: '', description: '' })

const load = async () => {
  try {
    const res = await getCategories()
    list.value = res.data.data || []
  } catch {
    flash.value = '加载失败'
  }
}

const handleCreate = async () => {
  const n = newName.value.trim()
  if (!n) return
  creating.value = true
  flash.value = ''
  try {
    await createCategory({ name: n, description: newDesc.value.trim() })
    newName.value = ''
    newDesc.value = ''
    flash.value = '已新增'
    await load()
  } catch (e) {
    flash.value = e.response?.data?.message || '创建失败'
  } finally {
    creating.value = false
  }
}

const startEdit = (c) => {
  editing.value = c._id
  editForm.name = c.name
  editForm.description = c.description || ''
}

const saveEdit = async (id) => {
  try {
    await updateCategory(id, { name: editForm.name.trim(), description: editForm.description.trim() })
    editing.value = null
    await load()
  } catch (e) {
    flash.value = e.response?.data?.message || '更新失败'
  }
}

const removeCat = async (id) => {
  if (!confirm('确定删除该分类？若仍有文章绑定将无法删除。')) return
  try {
    await deleteCategory(id)
    await load()
  } catch (e) {
    alert(e.response?.data?.message || '删除失败')
  }
}

onMounted(load)
</script>

<style scoped>
.admin-page {
  max-width: 760px;
  margin: 0 auto;
}
.admin-page__head h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0 0 0.35rem;
}
.admin-page__head p {
  margin: 0 0 1.25rem;
  color: var(--color-ink-muted);
}
.add-form {
  padding: 1rem;
  margin-bottom: 1.25rem;
}
.add-form h3 {
  margin: 0 0 0.65rem;
  font-size: 1rem;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.row .input-text {
  flex: 1;
  min-width: 140px;
}
.flash {
  margin: 0.5rem 0 0;
  font-size: 0.88rem;
  color: var(--color-ink-muted);
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
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-elevated);
}
.table-list__main {
  flex: 1;
  min-width: 0;
}
.table-list__title {
  margin: 0 0 0.25rem;
  font-weight: 600;
  color: var(--color-ink);
}
.desc {
  margin-top: 0.35rem;
}
.sub {
  display: block;
  font-size: 0.82rem;
  color: var(--color-ink-muted);
}
.table-list__actions {
  display: flex;
  gap: 0.35rem;
}
.empty {
  text-align: center;
  padding: 2rem;
  color: var(--color-ink-muted);
}
</style>
