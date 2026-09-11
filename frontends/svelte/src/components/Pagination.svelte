<script lang="ts">
  interface Props {
    total: number
    limit: number
    currentPage: number
    onpagechange?: (page: number) => void
  }

  let { total, limit, currentPage, onpagechange }: Props = $props()

  const totalPages = $derived(Math.ceil(total / limit))

  function goTo(page: number) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onpagechange?.(page)
    }
  }
</script>

{#if totalPages > 1}
  <ul class="pagination">
    {#each Array.from({ length: totalPages }, (_, i) => i + 1) as page (page)}
      <li class="page-item" class:active={page === currentPage}>
        <a class="page-link" href="" onclick={(e) => { e.preventDefault(); goTo(page) }}>{page}</a>
      </li>
    {/each}
  </ul>
{/if}
