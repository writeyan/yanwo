<template>
  <div class="auth-card" role="main">
    <h2 class="auth-card__title">加入燕窝</h2>
    <p class="auth-card__sub">几秒内即可开始写作与评论</p>
    <form @submit.prevent="handleRegister" class="auth-form" novalidate>
      <div class="form-line">
        <label class="label" for="user">用户名</label>
        <input id="user" v-model="form.username" class="input-text" type="text" required autocomplete="username" />
      </div>
      <div class="form-line">
        <label class="label" for="email">邮箱</label>
        <input id="email" v-model="form.email" class="input-text" type="email" required autocomplete="email" />
      </div>
      <div class="form-line">
        <label class="label" for="npw">密码</label>
        <input
          id="npw"
          v-model="form.password"
          class="input-text"
          type="password"
          required
          autocomplete="new-password"
        />
      </div>
      <p class="pwd-hint">至少 8 位，需同时包含英文字母与数字。</p>
      <p v-if="errorMsg" class="auth-err" role="alert">{{ errorMsg }}</p>
      <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.4rem" :disabled="loading">
        {{ loading ? '注册中…' : '注册' }}
      </button>
    </form>
    <p class="auth-link-bottom">
      已有账号？<router-link to="/login">去登录</router-link>
    </p>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerApi } from '../api/auth'

const router = useRouter()
const form = reactive({ username: '', email: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')

const handleRegister = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await registerApi(form)
    if (res.data.code === 201) {
      router.push({ path: '/login', query: { registered: '1' } })
    } else {
      errorMsg.value = res.data.message || '注册失败'
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 2.2rem 2rem 2.4rem;
  background: #fffcf7;
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
  letter-spacing: 0.08em;
}
.auth-card__sub {
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-ink-muted);
  margin: 0 0 1.4rem;
}
.form-line {
  margin-bottom: 1rem;
}
.auth-err {
  color: #9b2b2b;
  font-size: 0.88rem;
  text-align: center;
  margin: 0.2rem 0 0.5rem;
  line-height: 1.4;
}
.pwd-hint {
  font-size: 0.82rem;
  color: var(--color-ink-muted);
  margin: -0.35rem 0 0.5rem;
  line-height: 1.45;
}
.auth-link-bottom {
  text-align: center;
  margin: 1.2rem 0 0;
  font-size: 0.9rem;
  color: var(--color-ink-muted);
}
.auth-link-bottom a {
  font-weight: 600;
  color: var(--color-primary);
}
</style>
