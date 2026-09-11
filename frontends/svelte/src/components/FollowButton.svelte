<script lang="ts">
  import { api } from '@/lib/api'
  import { auth } from '@/lib/auth.svelte'

  interface Props {
    username: string
    following: boolean
    onupdate?: (following: boolean) => void
  }

  let { username, following, onupdate }: Props = $props()

  async function toggle() {
    if (!auth.isAuthenticated) return
    const { profile } = following
      ? await api.unfollow(username)
      : await api.follow(username)
    onupdate?.(profile.following)
  }
</script>

{#if auth.isAuthenticated && auth.user?.username !== username}
  <button
    class="btn btn-sm btn-outline-secondary action-btn"
    onclick={(e) => { e.preventDefault(); toggle() }}
  >
    <i class={following ? 'ion-minus-round' : 'ion-plus-round'}></i>
    &nbsp; {following ? 'Unfollow' : 'Follow'} {username}
  </button>
{/if}
