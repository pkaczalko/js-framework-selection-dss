<script lang="ts">
  import type { Article } from '@/lib/types'
  import ArticleMeta from './ArticleMeta.svelte'
  import RouterLink from '@/lib/RouterLink.svelte'

  interface Props {
    article: Article
    onupdate?: (article: Article) => void
  }

  let { article, onupdate }: Props = $props()
</script>

<div class="article-preview">
  <ArticleMeta {article} {onupdate} />
  <RouterLink href="/article/{article.slug}" class="preview-link">
    <h1>{article.title}</h1>
    <p>{article.description}</p>
    <span>Read more...</span>
    <ul class="tag-list">
      {#each article.tagList as tag (tag)}
        <li class="tag-default tag-pill tag-outline">{tag}</li>
      {/each}
    </ul>
  </RouterLink>
</div>
