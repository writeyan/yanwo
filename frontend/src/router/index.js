/**
 * 路由与导航守卫
 *
 * 站点前台使用 SiteLayout；/login、/register、/forgot-password 使用 AuthLayout；
 * /admin/* 使用 AdminLayout 且 meta.requiresAdmin。守卫根据 Pinia 中 token 与 role 跳转。
 */
import { createRouter, createWebHistory } from 'vue-router'
import SiteLayout from '../layouts/SiteLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import Home from '../views/Home.vue'
import PostDetail from '../views/PostDetail.vue'
import CreatePost from '../views/CreatePost.vue'
import EditPost from '../views/EditPost.vue'
import TagArchive from '../views/TagArchive.vue'
import Archive from '../views/Archive.vue'
import UserProfile from '../views/UserProfile.vue'
import Favorites from '../views/Favorites.vue'
import Login from '../views/login.vue'
import Register from '../views/Register.vue'
import ForgotPassword from '../views/ForgotPassword.vue'
import Dashboard from '../views/admin/Dashboard.vue'
import PostManage from '../views/admin/PostManage.vue'
import CommentReview from '../views/admin/CommentReview.vue'
import CategoriesManage from '../views/admin/CategoriesManage.vue'
import UserManage from '../views/admin/UserManage.vue'
import { useUserStore } from '../store/user'

const routes = [
  {
    path: '/login',
    component: AuthLayout,
    children: [{ path: '', name: 'login', component: Login }],
  },
  {
    path: '/register',
    component: AuthLayout,
    children: [{ path: '', name: 'register', component: Register }],
  },
  {
    path: '/forgot-password',
    component: AuthLayout,
    children: [{ path: '', name: 'forgot-password', component: ForgotPassword }],
  },
  {
    path: '/',
    component: SiteLayout,
    children: [
      { path: '', name: 'home', component: Home },
      { path: 'post/:slug', name: 'post', component: PostDetail },
      { path: 'create', name: 'create', component: CreatePost, meta: { requiresAuth: true } },
      { path: 'edit/:id', name: 'edit-post', component: EditPost, meta: { requiresAuth: true } },
      { path: 'my-posts', name: 'my-posts', component: PostManage, meta: { requiresAuth: true } },
      { path: 'tags', name: 'tags', component: TagArchive },
      { path: 'archive', name: 'archive', component: Archive },
      { path: 'me', name: 'me', component: UserProfile, meta: { requiresAuth: true } },
      { path: 'favorites', name: 'favorites', component: Favorites, meta: { requiresAuth: true } },
    ],
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: 'dashboard', name: 'admin-dashboard', component: Dashboard },
      { path: 'posts', name: 'admin-posts', component: PostManage },
      { path: 'categories', name: 'admin-categories', component: CategoriesManage },
      { path: 'comments', name: 'admin-comments', component: CommentReview },
      { path: 'users', name: 'admin-users', component: UserManage },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  },
})

// 全局前置守卫：未登录访问受保护页 → 登录页；非管理员访问 /admin → 首页
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isAuthenticated = !!userStore.token
  const userRole = userStore.userInfo?.role
  const needsAuth = to.matched.some((r) => r.meta.requiresAuth)
  const needsAdmin = to.matched.some((r) => r.meta.requiresAdmin)
  if (needsAuth && !isAuthenticated) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }
  if (needsAdmin && userRole !== 'admin') {
    return next('/')
  }
  next()
})

export default router
