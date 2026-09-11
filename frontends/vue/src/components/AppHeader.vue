<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/stores/auth'

const route = useRoute()
const auth = useAuth()

const isHome = computed(() => route.path === '/')
const isLogin = computed(() => route.path === '/login')
const isRegister = computed(() => route.path === '/register')
const isSettings = computed(() => route.path === '/settings')
const isEditor = computed(() => route.path.startsWith('/editor'))
</script>

<template>
  <nav class="navbar navbar-light">
    <div class="container">
      <RouterLink class="navbar-brand" to="/">conduit</RouterLink>
      <ul class="nav navbar-nav pull-xs-right">
        <template v-if="auth.isAuthenticated && auth.user">
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: isHome }" to="/">
              Home
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: isEditor }" to="/editor">
              <i class="ion-compose"></i>&nbsp;New Article
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: isSettings }" to="/settings">
              <i class="ion-gear-a"></i>&nbsp;Settings
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink
              class="nav-link"
              :class="{ active: route.path === `/profile/${auth.user.username}` }"
              :to="`/profile/${auth.user.username}`"
            >
              <img :src="auth.user.image" class="user-pic" />
              {{ auth.user.username }}
            </RouterLink>
          </li>
        </template>
        <template v-else>
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: isHome }" to="/">
              Home
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: isLogin }" to="/login">
              Sign in
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: isRegister }" to="/register">
              Sign up
            </RouterLink>
          </li>
        </template>
      </ul>
    </div>
  </nav>
</template>
