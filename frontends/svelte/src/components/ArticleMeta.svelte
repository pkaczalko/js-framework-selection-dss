<script lang="ts">
  import type { Article } from '@/lib/types'
  import { formatDate } from '@/lib/utils/date'
  import FavoriteButton from './FavoriteButton.svelte'
  import RouterLink from '@/lib/RouterLink.svelte'

  interface Props {
    article: Article
    hideFavorite?: boolean
    onupdate?: (article: Article) => void
  }

  let { article, hideFavorite = false, onupdate }: Props = $props()
</script>

<div class="article-meta">
  <RouterLink href="/profile/{article.author.username}">
    <img src={article.author.image} alt="" />
  </RouterLink>
  <div class="info">
    <RouterLink href="/profile/{article.author.username}" class="author">
      {article.author.username}
    </RouterLink>
    <span class="date">{formatDate(article.createdAt)}</span>
  </div>
  {#if !hideFavorite}
    <FavoriteButton {article} {onupdate} />
  {/if}
</div>
