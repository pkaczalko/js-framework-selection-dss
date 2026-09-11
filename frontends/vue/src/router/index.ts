import { createRouter, createWebHistory } from 'vue-router'
import { initAuth, useAuth } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('../views/EditorView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/editor/:slug',
      name: 'editor-edit',
      component: () => import('../views/EditorView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/article/:slug',
      name: 'article',
      component: () => import('../views/ArticleView.vue'),
    },
    {
      path: '/profile/:username',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
    },
    {
      path: '/profile/:username/favorites',
      name: 'profile-favorites',
      component: () => import('../views/ProfileView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuth()
  if (!auth.ready) {
    await initAuth()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login'
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return '/'
  }
})

export default router
