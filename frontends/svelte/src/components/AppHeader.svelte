<script lang="ts">
  import RouterLink from '@/lib/RouterLink.svelte'
  import { router } from '@/lib/router.svelte'
  import { auth } from '@/lib/auth.svelte'
</script>

<nav class="navbar navbar-light">
  <div class="container">
    <RouterLink class="navbar-brand" href="/">conduit</RouterLink>
    <ul class="nav navbar-nav pull-xs-right">
      {#if auth.isAuthenticated && auth.user}
        <li class="nav-item">
          <RouterLink class="nav-link" href="/" active={router.route.path === '/'}>
            Home
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink class="nav-link" href="/editor" active={router.route.path.startsWith('/editor')}>
            <i class="ion-compose"></i>&nbsp;New Article
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink class="nav-link" href="/settings" active={router.route.path === '/settings'}>
            <i class="ion-gear-a"></i>&nbsp;Settings
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink
            class="nav-link"
            href="/profile/{auth.user.username}"
            active={router.route.path === `/profile/${auth.user.username}`}
          >
            <img src={auth.user.image} class="user-pic" alt="" />
            {auth.user.username}
          </RouterLink>
        </li>
      {:else}
        <li class="nav-item">
          <RouterLink class="nav-link" href="/" active={router.route.path === '/'}>
            Home
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink class="nav-link" href="/login" active={router.route.path === '/login'}>
            Sign in
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink class="nav-link" href="/register" active={router.route.path === '/register'}>
            Sign up
          </RouterLink>
        </li>
      {/if}
    </ul>
  </div>
</nav>
