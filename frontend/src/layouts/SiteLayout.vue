<template>
  <div class="site-layout">
    <SiteHeader />
    <main class="site-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <SiteFooter />
  </div>
</template>

<script setup>
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
</script>

<style scoped>
.site-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.site-main {
  flex: 1;
  width: 100%;
  padding-bottom: 2rem;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
