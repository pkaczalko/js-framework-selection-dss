<script lang="ts">
  import { ApiError, formatErrors } from '@/lib/api'
  import { login } from '@/lib/auth.svelte'
  import { navigate } from '@/lib/router.svelte'
  import RouterLink from '@/lib/RouterLink.svelte'

  let email = $state('')
  let password = $state('')
  let errors = $state<string[]>([])

  async function submit() {
    errors = []
    try {
      await login(email, password)
      navigate('/')
    } catch (e) {
      if (e instanceof ApiError) {
        errors = formatErrors(e.errors)
      }
    }
  }
</script>

<div class="auth-page">
  <div class="container page">
    <div class="row">
      <div class="col-md-6 offset-md-3 col-xs-12">
        <h1 class="text-xs-center">Sign in</h1>
        <p class="text-xs-center">
          <RouterLink href="/register">Need an account?</RouterLink>
        </p>
        {#if errors.length}
          <ul class="error-messages">
            {#each errors as err, i (i)}
              <li>{err}</li>
            {/each}
          </ul>
        {/if}
        <form onsubmit={(e) => { e.preventDefault(); submit() }}>
          <fieldset class="form-group">
            <input
              bind:value={email}
              class="form-control form-control-lg"
              type="text"
              placeholder="Email"
            />
          </fieldset>
          <fieldset class="form-group">
            <input
              bind:value={password}
              class="form-control form-control-lg"
              type="password"
              placeholder="Password"
            />
          </fieldset>
          <button class="btn btn-lg btn-primary pull-xs-right">Sign in</button>
        </form>
      </div>
    </div>
  </div>
</div>
