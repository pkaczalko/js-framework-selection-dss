<script lang="ts">
  import { onMount } from 'svelte'
  import { api } from '@/lib/api'
  import { router, navigate } from '@/lib/router.svelte'

  let tags = $state<string[]>([])

  onMount(async () => {
    try {
      const { tags: fetched } = await api.getTags()
      tags = fetched
    } catch {
      tags = []
    }
  })

  function selectTag(tag: string) {
    const query = { ...router.route.query, tag }
    delete query.page
    navigate({ path: '/', query })
  }
</script>

<div class="sidebar">
  <p>Popular Tags</p>
  <div class="tag-list">
    {#each tags as tag (tag)}
      <a href="" class="tag-pill tag-default" onclick={(e) => { e.preventDefault(); selectTag(tag) }}>
        {tag}
      </a>
    {/each}
  </div>
</div>
