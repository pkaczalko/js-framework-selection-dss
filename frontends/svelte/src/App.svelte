<script lang="ts">
  import AppHeader from '@/components/AppHeader.svelte'
  import AppFooter from '@/components/AppFooter.svelte'
  import { router } from '@/lib/router.svelte'

  const CurrentView = $derived(router.component)
</script>

<AppHeader />
{#key router.route.path}
  {#if CurrentView}
    <CurrentView />
  {/if}
{/key}
<AppFooter />

<style>
  :global(#app) {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 100vh;
  }
</style>
