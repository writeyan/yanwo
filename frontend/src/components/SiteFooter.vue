<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <p class="site-footer__brand">燕窝 · 用写作记录思考</p>
      <div class="site-footer__links">
        <router-link to="/">首页</router-link>
        <router-link to="/tags">标签</router-link>
      </div>
      <p class="site-footer__copy">© {{ year }} · 燕窝</p>
    </div>
  </footer>
</template>

<script setup>
/** 站点页脚：展示版权年份 */
const year = new Date().getFullYear()
</script>

<style scoped>
.site-footer {
  margin-top: auto;
  border-top: 1px solid var(--color-border);
  background: rgba(255, 252, 247, 0.6);
}
.site-footer__inner {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 2rem 1.25rem 2.5rem;
  text-align: center;
}
.site-footer__brand {
  font-size: 0.95rem;
  color: var(--color-ink-muted);
  margin-bottom: 0.75rem;
}
.site-footer__links {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}
.site-footer__links a {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-primary);
}
.site-footer__copy {
  font-size: 0.8rem;
  color: #8a8a94;
}
</style>
