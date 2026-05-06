<template>

  <div class="profile-page">

    <header class="profile-head">

      <h1>我的主页</h1>

      <p>管理头像与个性签名，查看创作数据。</p>

    </header>



    <section class="profile-grid">

      <div class="card profile-card">

        <div class="avatar-wrap">

          <img v-if="avatarSrc" :src="avatarSrc" class="avatar" alt="头像" />

          <div v-else class="avatar avatar--fallback">{{ fallbackName }}</div>

        </div>

        <div class="profile-main">

          <h2>{{ userStore.userInfo?.username }}</h2>

          <p class="muted">{{ userStore.userInfo?.email }}</p>

          <p class="bio-preview">{{ form.bio || '这个人很懒，还没有留下个性签名。' }}</p>

        </div>

      </div>



      <div class="card stats-card">

        <h3>创作统计</h3>

        <div class="stats">

          <div class="stat-item">

            <span class="label">文章数量</span>

            <strong>{{ stats.articleCount }}</strong>

          </div>

          <div class="stat-item">

            <span class="label">累计浏览量</span>

            <strong>{{ stats.totalViews }}</strong>

          </div>

        </div>

      </div>

    </section>



    <section class="card edit-card">

      <h3>编辑资料</h3>

      <form @submit.prevent="submit" class="edit-form">

        <div class="form-group">

          <label class="label" for="avatar-file">上传头像</label>

          <input

            id="avatar-file"

            type="file"

            accept="image/jpeg,image/png,image/gif,image/webp"

            class="input-file"

            @change="onAvatarFile"

          />

          <p class="field-hint">支持 JPG / PNG / GIF / WebP，单张不超过 2MB。上传后将覆盖下方 URL。</p>

        </div>

        <div class="form-group">

          <label class="label" for="avatar">头像 URL（可选）</label>

          <input id="avatar" v-model="form.avatar" class="input-text" type="url" placeholder="https://..." />

        </div>

        <div class="form-group">

          <label class="label" for="bio">个性签名（200字内）</label>

          <textarea

            id="bio"

            v-model="form.bio"

            class="input-text"

            rows="4"

            maxlength="200"

            placeholder="写一点你的介绍..."

          />

        </div>

        <p v-if="msg" :class="['msg', msgType === 'ok' ? 'msg-ok' : 'msg-err']">{{ msg }}</p>

        <button type="submit" class="btn btn-primary" :disabled="saving">

          {{ saving ? '保存中...' : '保存资料' }}

        </button>

      </form>

    </section>



    <section class="card edit-card">

      <h3>修改密码</h3>

      <form class="edit-form" @submit.prevent="submitPassword">

        <div class="form-group">

          <label class="label" for="pw-cur">当前密码</label>

          <input id="pw-cur" v-model="pwd.current" class="input-text" type="password" autocomplete="current-password" />

        </div>

        <div class="form-group">

          <label class="label" for="pw-new">新密码</label>

          <input id="pw-new" v-model="pwd.next" class="input-text" type="password" autocomplete="new-password" />

        </div>

        <p class="field-hint">至少 8 位，需同时包含英文字母与数字。</p>

        <p v-if="pwdMsg" :class="['msg', pwdOk ? 'msg-ok' : 'msg-err']">{{ pwdMsg }}</p>

        <button type="submit" class="btn btn-primary" :disabled="pwdSaving">

          {{ pwdSaving ? '更新中…' : '更新密码' }}

        </button>

      </form>

    </section>

  </div>

</template>



<script setup>

import { computed, onMounted, reactive, ref } from 'vue'

import { useUserStore } from '../store/user'

import { getProfileApi, updateProfileApi, changePasswordApi, uploadAvatarApi } from '../api/auth'



const userStore = useUserStore()

const saving = ref(false)

const msg = ref('')

const msgType = ref('ok')

const stats = reactive({ articleCount: 0, totalViews: 0 })

const form = reactive({ avatar: '', bio: '' })

const pwd = reactive({ current: '', next: '' })

const pwdMsg = ref('')

const pwdOk = ref(true)

const pwdSaving = ref(false)



const fallbackName = computed(() => (userStore.userInfo?.username || '?').slice(0, 1).toUpperCase())



const avatarSrc = computed(() => {

  const a = form.avatar || userStore.userInfo?.avatar

  if (!a) return ''

  if (/^https?:\/\//i.test(a)) return a

  return a

})



const loadProfile = async () => {

  try {

    const res = await getProfileApi()

    const data = res.data.data

    form.avatar = data.user.avatar || ''

    form.bio = data.user.bio || ''

    stats.articleCount = data.stats.articleCount || 0

    stats.totalViews = data.stats.totalViews || 0

    userStore.setUserInfo({ ...userStore.userInfo, ...data.user })

  } catch {

    msg.value = '资料加载失败'

    msgType.value = 'err'

  }

}



const submit = async () => {

  saving.value = true

  msg.value = ''

  try {

    const res = await updateProfileApi({ avatar: form.avatar, bio: form.bio })

    userStore.setUserInfo({ ...userStore.userInfo, ...res.data.data })

    msg.value = '资料已更新'

    msgType.value = 'ok'

  } catch (e) {

    msg.value = e.response?.data?.message || '保存失败'

    msgType.value = 'err'

  } finally {

    saving.value = false

  }

}



const onAvatarFile = async (e) => {

  const file = e.target.files?.[0]

  e.target.value = ''

  if (!file) return

  msg.value = ''

  try {

    const res = await uploadAvatarApi(file)

    const u = res.data.data

    form.avatar = u.avatar || form.avatar

    userStore.setUserInfo({ ...userStore.userInfo, ...u })

    msg.value = '头像已上传'

    msgType.value = 'ok'

  } catch (err) {

    msg.value = err.response?.data?.message || '上传失败'

    msgType.value = 'err'

  }

}



const submitPassword = async () => {

  pwdMsg.value = ''

  pwdSaving.value = true

  try {

    await changePasswordApi({ currentPassword: pwd.current, newPassword: pwd.next })

    pwd.current = ''

    pwd.next = ''

    pwdMsg.value = '密码已更新'

    pwdOk.value = true

  } catch (e) {

    pwdMsg.value = e.response?.data?.message || '修改失败'

    pwdOk.value = false

  } finally {

    pwdSaving.value = false

  }

}



onMounted(loadProfile)

</script>



<style scoped>

.profile-page { max-width: 980px; margin: 0 auto; padding: 0 1.25rem 2rem; }

.profile-head { margin: 1.5rem 0 1rem; }

.profile-head h1 { margin: 0 0 0.4rem; font-size: 1.8rem; color: var(--color-ink); }

.profile-head p { margin: 0; color: var(--color-ink-muted); }

.profile-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1rem; margin-bottom: 1rem; }

.profile-card { display: flex; gap: 1rem; padding: 1rem; align-items: center; }

.avatar-wrap { flex-shrink: 0; }

.avatar { width: 88px; height: 88px; border-radius: 50%; object-fit: cover; border: 1px solid var(--color-border); }

.avatar--fallback { display: flex; align-items: center; justify-content: center; background: var(--color-primary); color: #fff; font-size: 2rem; font-weight: 700; }

.profile-main h2 { margin: 0 0 0.2rem; }

.muted { color: var(--color-ink-muted); margin: 0 0 0.5rem; }

.bio-preview { margin: 0; line-height: 1.6; color: var(--color-ink); }

.stats-card { padding: 1rem; }

.stats-card h3 { margin: 0 0 0.8rem; }

.stats { display: grid; gap: 0.8rem; }

.stat-item .label { color: var(--color-ink-muted); font-size: 0.9rem; display: block; margin-bottom: 0.2rem; }

.stat-item strong { font-size: 1.6rem; color: var(--color-ink); }

.edit-card { padding: 1rem; margin-bottom: 1rem; }

.edit-card h3 { margin: 0 0 0.8rem; }

.edit-form { display: grid; gap: 0.8rem; }

.field-hint { font-size: 0.85rem; color: var(--color-ink-muted); margin: 0; }

.input-file { font-size: 0.9rem; }

.msg { margin: 0; font-size: 0.9rem; }

.msg-ok { color: #2f855a; }

.msg-err { color: #c53030; }

@media (max-width: 860px) { .profile-grid { grid-template-columns: 1fr; } }

</style>

