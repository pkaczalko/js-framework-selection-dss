<script setup lang="ts">
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
      <NuxtLink class="navbar-brand" to="/">conduit</NuxtLink>
      <ul class="nav navbar-nav pull-xs-right">
        <template v-if="auth.isAuthenticated.value && auth.user.value">
          <li class="nav-item">
            <NuxtLink class="nav-link" :class="{ active: isHome }" to="/">
              Home
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink class="nav-link" :class="{ active: isEditor }" to="/editor">
              <i class="ion-compose"></i>&nbsp;New Article
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink class="nav-link" :class="{ active: isSettings }" to="/settings">
              <i class="ion-gear-a"></i>&nbsp;Settings
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink
              class="nav-link"
              :class="{ active: route.path === `/profile/${auth.user.value.username}` }"
              :to="`/profile/${auth.user.value.username}`"
            >
              <img :src="auth.user.value.image" class="user-pic" />
              {{ auth.user.value.username }}
            </NuxtLink>
          </li>
        </template>
        <template v-else>
          <li class="nav-item">
            <NuxtLink class="nav-link" :class="{ active: isHome }" to="/">
              Home
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink class="nav-link" :class="{ active: isLogin }" to="/login">
              Sign in
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink class="nav-link" :class="{ active: isRegister }" to="/register">
              Sign up
            </NuxtLink>
          </li>
        </template>
      </ul>
    </div>
  </nav>
</template>
