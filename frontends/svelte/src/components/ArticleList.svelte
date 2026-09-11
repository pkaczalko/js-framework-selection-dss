<script lang="ts">
  import type { Article } from '@/lib/types'
  import ArticlePreview from './ArticlePreview.svelte'
  import Pagination from './Pagination.svelte'

  interface Props {
    articles: Article[]
    total: number
    limit: number
    currentPage: number
    loading: boolean
    onpagechange?: (page: number) => void
    onupdate?: (article: Article) => void
  }

  let { articles, total, limit, currentPage, loading, onpagechange, onupdate }: Props = $props()
</script>

{#if loading}
  <div>Loading...</div>
{:else}
  {#if articles.length === 0}
    <div class="empty-feed-message">No articles are here... yet.</div>
  {/if}
  {#each articles as article (article.slug)}
    <ArticlePreview {article} {onupdate} />
  {/each}
  <Pagination {total} {limit} {currentPage} onpagechange={onpagechange} />
{/if}
