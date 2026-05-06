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
          to="/admin/comments"
          class="admin-nav__item"
          active-class="admin-nav__item--active"
        >评论审核</router-link
        >
      </nav>
      <router-link to="/" class="admin-layout__front">← 回首页</router-link>
    </aside>
    <div class="admin-layout__main">
      <header class="admin-layout__main-head">
        <router-link to="/" class="btn btn-primary admin-layout__home-btn">← 回首页</router-link>
      </header>
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #eef0ec;
}
.admin-layout__aside {
  width: 220px;
  flex-shrink: 0;
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
.admin-layout__front {
  margin-top: auto;
  margin-left: 1.1rem;
  margin-right: 1.1rem;
  padding: 0.55rem 0.85rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  color: #1a1f1c;
  background: linear-gradient(180deg, #f4f6f2 0%, #e4e8e0 100%);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22);
  transition: background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.admin-layout__front:hover {
  color: #1a1f1c;
  background: #fff;
  border-color: #c45c3e;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18);
}
.admin-layout__main {
  flex: 1;
  min-width: 0;
  padding: 1.25rem 1.75rem 2.5rem;
  overflow-x: auto;
}
.admin-layout__main-head {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 0.65rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid var(--color-border);
}
.admin-layout__home-btn {
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
  }
  .admin-layout__aside {
    width: 100%;
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
  .admin-layout__front {
    margin-top: 0;
    margin-left: 0;
    margin-right: 0;
    width: 100%;
    max-width: 12rem;
  }
}
</style>
