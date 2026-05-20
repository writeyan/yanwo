<template>
  <div class="auth-card" role="main">
    <h2 class="auth-card__title">找回密码</h2>
    <p class="auth-card__sub">通过简单算术验证码重置密码（不使用邮箱）</p>

    <form class="auth-form" @submit.prevent="onSubmit" novalidate>
      <div class="form-line">
        <label class="label" for="id">邮箱或用户名</label>
        <input
          id="id"
          v-model="form.usernameOrEmail"
          type="text"
          class="input-text"
          autocomplete="username"
          required
        />
      </div>
      <div v-if="challenge.question" class="challenge-box">
        <p class="challenge-q">{{ challenge.question }}</p>
        <button type="button" class="btn btn-ghost btn-sm" @click="loadChallenge">换一题</button>
      </div>
      <div class="form-line">
        <label class="label" for="ans">答案（数字）</label>
        <input id="ans" v-model="form.answer" class="input-text" type="text" inputmode="numeric" />
      </div>
      <div class="form-line">
        <label class="label" for="npw">新密码</label>
        <input
          id="npw"
          v-model="form.newPassword"
          class="input-text"
          type="password"
          autocomplete="new-password"
        />
      </div>
      <p class="pwd-hint">至少 8 位，含英文字母与数字。</p>
      <p v-if="msg" class="auth-err" role="alert">{{ msg }}</p>
      <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.35rem" :disabled="busy">
        {{ busy ? '提交中…' : '重置密码' }}
      </button>
    </form>
    <p class="auth-link-bottom">
      <router-link to="/login">返回登录</router-link>
    </p>
  </div>
</template>

<script setup>
/** 忘记密码：算术验证码 + 账号重置（无邮件） */
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getForgotChallengeApi, forgotResetApi } from '../api/auth'
import { validatePasswordClient } from '../utils/formValidators'

const router = useRouter()
const busy = ref(false)
const msg = ref('')
const challenge = reactive({ challengeId: '', question: '' })
const form = reactive({
  usernameOrEmail: '',
  answer: '',
  newPassword: '',
})

const loadChallenge = async () => {
  msg.value = ''
  try {
    const res = await getForgotChallengeApi()
    const d = res.data.data
    challenge.challengeId = d.challengeId
    challenge.question = d.question
  } catch (e) {
    msg.value = e.response?.data?.message || '获取验证码失败'
  }
}

const onSubmit = async () => {
  msg.value = ''
  const pwd = validatePasswordClient(form.newPassword)
  if (!pwd.ok) {
    msg.value = pwd.message
    return
  }
  if (!challenge.challengeId) {
    msg.value = '请先加载算术题'
    return
  }
  busy.value = true
  try {
    const res = await forgotResetApi({
      usernameOrEmail: form.usernameOrEmail.trim(),
      challengeId: challenge.challengeId,
      answer: form.answer.trim(),
      newPassword: form.newPassword,
    })
    if (res.data.code === 200) {
      router.push({ path: '/login', query: { reset: '1' } })
    } else {
      msg.value = res.data.message || '重置失败'
    }
  } catch (e) {
    msg.value = e.response?.data?.message || '重置失败，请稍后重试'
    await loadChallenge()
  } finally {
    busy.value = false
  }
}

onMounted(loadChallenge)
</script>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 2.2rem 2rem 2.4rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
}
.auth-card__title {
  text-align: center;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0 0 0.4rem;
}
.auth-card__sub {
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-ink-muted);
  margin: 0 0 1.25rem;
}
.form-line {
  margin-bottom: 1rem;
}
.challenge-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.65rem 0.85rem;
  background: rgba(45, 74, 62, 0.06);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}
.challenge-q {
  margin: 0;
  font-weight: 600;
  color: var(--color-ink);
}
.pwd-hint {
  font-size: 0.82rem;
  color: var(--color-ink-muted);
  margin: -0.35rem 0 0.5rem;
}
.auth-err {
  color: #b83232;
  font-size: 0.88rem;
  text-align: center;
  margin: 0.35rem 0;
}
.auth-link-bottom {
  text-align: center;
  margin: 1.2rem 0 0;
  font-size: 0.9rem;
}
</style>
