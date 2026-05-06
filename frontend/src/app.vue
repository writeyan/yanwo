<!-- 应用根：仅承载路由视图；站点/登录/后台布局由各路由对应的 Layout 组件提供 -->
<template>
  <router-view />
</template>

<style>
@import './assets/theme.css';
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html,
body,
#app {
  min-height: 100%;
}
</style>
