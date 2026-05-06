<template>
  <div class="auth-layout">
    <div class="auth-layout__bg" aria-hidden="true" />
    <router-link to="/" class="auth-layout__back">← 回首页</router-link>
    <div class="auth-layout__center">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}
.auth-layout__bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 30% 10%, rgba(45, 74, 62, 0.12), transparent 55%),
    radial-gradient(ellipse 70% 50% at 90% 90%, rgba(196, 92, 62, 0.1), transparent 50%),
    linear-gradient(165deg, #f0ebe4 0%, #e8e2d8 45%, #ddd5c8 100%);
  z-index: 0;
}
.auth-layout__back {
  position: absolute;
  top: 1.25rem;
  left: 1.25rem;
  z-index: 2;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-primary);
  text-decoration: none;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  background: rgba(255, 252, 247, 0.75);
  border: 1px solid var(--color-border);
}
.auth-layout__back:hover {
  color: var(--color-accent);
}
.auth-layout__center {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
}
</style>
