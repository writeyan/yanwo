<template>
  <div class="admin-layout">
    <aside class="admin-layout__aside" aria-label="后台导航">
      <div class="admin-layout__brand">
        <span class="admin-layout__mark" />
        <span>燕窝 · 管理</span>
      </div>
      <nav class="admin-layout__nav">
        <router-link
          to="/admin/dashboard"
          class="admin-nav__item"
          active-class="admin-nav__item--active"
        >仪表盘</router-link
        >
        <router-link
          to="/admin/posts"
          class="admin-nav__item"
          active-class="admin-nav__item--active"
        >文章管理</router-link
        >
        <router-link
          to="/admin/categories"
          class="admin-nav__item"
          active-class="admin-nav__item--active"
        >分类</router-link
        >
        <router-link
          to="/admin/comments"
          class="admin-nav__item"
          active-class="admin-nav__item--active"
        >评论审核</router-link
        >
        <router-link
          to="/admin/users"
          class="admin-nav__item"
          active-class="admin-nav__item--active"
        >用户</router-link
        >
      </nav>
    </aside>
    <div class="admin-layout__main">
      <router-link to="/" class="btn btn-primary admin-layout__home-btn">← 回首页</router-link>
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
  background: #eef0ec;
}
.admin-layout__aside {
  width: 220px;
  flex-shrink: 0;
  align-self: stretch;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  background: #1a1f1c;
  color: #e4e6e2;
  padding: 1.5rem 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.admin-layout__brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0 1.25rem;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.04em;
}
.admin-layout__mark {
  width: 6px;
  height: 22px;
  background: linear-gradient(180deg, #5a8f7b, #c45c3e);
  border-radius: 2px;
}
.admin-layout__nav {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.admin-nav__item {
  padding: 0.65rem 1.25rem;
  font-size: 0.95rem;
  color: #a8ada7;
  text-decoration: none;
  border-left: 3px solid transparent;
  transition: color 0.2s, background 0.2s, border-color 0.2s;
}
.admin-nav__item:hover {
  color: #f0f2ee;
  background: rgba(255, 255, 255, 0.04);
}
.admin-nav__item--active {
  color: #f5f7f3;
  background: rgba(90, 143, 123, 0.12);
  border-left-color: #5a8f7b;
}
.admin-layout__main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 1.25rem 1.75rem 2.5rem;
  padding-top: 4rem;
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.admin-layout__home-btn {
  position: fixed;
  top: 1.25rem;
  right: 1.75rem;
  z-index: 100;
  text-decoration: none;
  font-weight: 600;
  padding: 0.5rem 1.2rem;
  font-size: 0.9rem;
  box-shadow: var(--shadow-md);
}
.admin-layout__home-btn:hover {
  box-shadow: var(--shadow-lg);
}
@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }
  .admin-layout__aside {
    width: 100%;
    height: auto;
    align-self: stretch;
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 40;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    padding: 1rem;
  }
  .admin-layout__nav {
    flex-direction: row;
    flex-wrap: wrap;
    flex: 1;
  }
  .admin-nav__item {
    border-left: none;
    border-bottom: 2px solid transparent;
    padding: 0.5rem 0.75rem;
  }
  .admin-nav__item--active {
    border-bottom-color: #5a8f7b;
    border-left-color: transparent;
  }
  .admin-layout__main {
    flex: 1 1 auto;
    min-height: 0;
    overflow-x: auto;
    overflow-y: visible;
    padding-top: 3.5rem;
  }
  .admin-layout__home-btn {
    top: 1rem;
    right: 1rem;
  }
}
</style>
