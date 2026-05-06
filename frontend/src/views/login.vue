<template>
  <div class="auth-card" role="main">
    <h2 class="auth-card__title">欢迎回来</h2>
    <p class="auth-card__sub">使用邮箱或用户名登录到燕窝</p>
    <p v-if="justRegistered" class="auth-ok" role="status">注册成功，请登录</p>
    <form @submit.prevent="handleLogin" class="auth-form" novalidate>
      <div class="form-line">
        <label class="label" for="id">邮箱 / 用户名</label>
        <input
          id="id"
          v-model="form.usernameOrEmail"
          class="input-text"
          type="text"
          autocomplete="username"
          required
        />
      </div>
      <div class="form-line">
        <label class="label" for="pw">密码</label>
        <input
          id="pw"
          v-model="form.password"
          class="input-text"
          type="password"
          autocomplete="current-password"
          required
        />
      </div>
      <p v-if="errorMsg" class="auth-err" role="alert">{{ errorMsg }}</p>
      <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.4rem" :disabled="loading">
        {{ loading ? '登录中…' : '登录' }}
      </button>
    </form>
    <p class="auth-link-bottom">
      还没有账号？<router-link to="/register">注册一个</router-link>
    </p>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { loginApi } from '../api/auth'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const form = reactive({ usernameOrEmail: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')
const justRegistered = computed(() => route.query.registered === '1')

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await loginApi(form)
    if (res.data.code === 200) {
      const { accessToken, user } = res.data.data
      userStore.setToken(accessToken)
      userStore.setUserInfo({ ...user, bio: user.bio || '' })
      const r = route.query.redirect
      if (typeof r === 'string' && r.startsWith('/')) {
        router.push(r)
      } else {
        router.push('/')
      }
    } else {
      errorMsg.value = res.data.message || '登录失败'
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
.auth-ok {
  text-align: center;
  color: #0f5132;
  background: #d1e7dd;
  font-size: 0.9rem;
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  margin: 0 0 1rem;
  line-height: 1.4;
}
</style>
