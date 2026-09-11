<script lang="ts">
  import type { Article } from '@/lib/types'
  import { api } from '@/lib/api'
  import { auth } from '@/lib/auth.svelte'

  interface Props {
    article: Article
    onupdate?: (article: Article) => void
  }

  let { article, onupdate }: Props = $props()

  async function toggle() {
    if (!auth.isAuthenticated) return
    const { article: updated } = article.favorited
      ? await api.unfavorite(article.slug)
      : await api.favorite(article.slug)
    onupdate?.(updated)
  }
</script>

{#if auth.isAuthenticated}
  <button
    class="btn btn-outline-primary btn-sm pull-xs-right"
    class:active={article.favorited}
    onclick={(e) => { e.preventDefault(); toggle() }}
  >
    <i class="ion-heart"></i> {article.favoritesCount}
  </button>
{/if}
