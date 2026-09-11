<script lang="ts">
  import { onMount } from 'svelte'
  import { ApiError, formatErrors } from '@/lib/api'
  import { auth, updateUser, logout } from '@/lib/auth.svelte'
  import { navigate } from '@/lib/router.svelte'

  let image = $state('')
  let username = $state('')
  let bio = $state('')
  let email = $state('')
  let password = $state('')
  let errors = $state<string[]>([])

  onMount(() => {
    if (auth.user) {
      image = auth.user.image
      username = auth.user.username
      bio = auth.user.bio
      email = auth.user.email
    }
  })

  async function submit() {
    errors = []
    try {
      const data: Record<string, string> = {
        image,
        username,
        bio,
        email,
      }
      if (password) {
        data.password = password
      }
      await updateUser(data)
      navigate(`/profile/${auth.user?.username}`)
    } catch (e) {
      if (e instanceof ApiError) {
        errors = formatErrors(e.errors)
      }
    }
  }

  function doLogout() {
    logout()
    navigate('/')
  }
</script>

<div class="settings-page">
  <div class="container page">
    <div class="row">
      <div class="col-md-6 offset-md-3 col-xs-12">
        <h1 class="text-xs-center">Your Settings</h1>
        {#if errors.length}
          <ul class="error-messages">
            {#each errors as err, i (i)}
              <li>{err}</li>
            {/each}
          </ul>
        {/if}
        <form onsubmit={(e) => { e.preventDefault(); submit() }}>
          <fieldset>
            <fieldset class="form-group">
              <input
                bind:value={image}
                class="form-control"
                type="text"
                placeholder="URL of profile picture"
              />
            </fieldset>
            <fieldset class="form-group">
              <input
                bind:value={username}
                class="form-control form-control-lg"
                type="text"
                placeholder="Your Name"
              />
            </fieldset>
            <fieldset class="form-group">
              <textarea
                bind:value={bio}
                class="form-control form-control-lg"
                rows="8"
                placeholder="Short bio about you"
              ></textarea>
            </fieldset>
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
                placeholder="New Password"
              />
            </fieldset>
            <button class="btn btn-lg btn-primary pull-xs-right">Update Settings</button>
          </fieldset>
        </form>
        <hr />
        <button class="btn btn-outline-danger" onclick={doLogout}>Or click here to logout.</button>
      </div>
    </div>
  </div>
</div>
