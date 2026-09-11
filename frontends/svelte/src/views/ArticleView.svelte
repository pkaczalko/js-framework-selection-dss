<script lang="ts">
  import { onMount } from 'svelte'
  import { marked } from 'marked'
  import { api } from '@/lib/api'
  import type { Article } from '@/lib/types'
  import { formatDate } from '@/lib/utils/date'
  import { auth } from '@/lib/auth.svelte'
  import { router, navigate, replace } from '@/lib/router.svelte'
  import FollowButton from '@/components/FollowButton.svelte'
  import CommentSection from '@/components/CommentSection.svelte'
  import RouterLink from '@/lib/RouterLink.svelte'

  let article = $state<Article | null>(null)
  let following = $state(false)

  const slug = $derived(router.route.params.slug)
  const isAuthor = $derived(auth.user?.username === article?.author.username)

  function renderMarkdown(text: string) {
    return marked.parse(text) as string
  }

  async function loadArticle() {
    try {
      const { article: fetched } = await api.getArticle(slug)
      article = fetched
      following = fetched.author.following
    } catch {
      replace('/')
    }
  }

  async function toggleFavorite() {
    if (!article || !auth.isAuthenticated) return
    const { article: updated } = article.favorited
      ? await api.unfavorite(article.slug)
      : await api.favorite(article.slug)
    article = updated
  }

  async function deleteArticle() {
    if (!article) return
    await api.deleteArticle(article.slug)
    navigate('/')
  }

  function onFollowUpdate(value: boolean) {
    following = value
    if (article) {
      article.author.following = value
    }
  }

  onMount(loadArticle)
</script>

{#if article}
  <div class="article-page">
    <div class="banner">
      <div class="container">
        <h1>{article.title}</h1>
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
          <FollowButton username={article.author.username} {following} onupdate={onFollowUpdate} />
          &nbsp;&nbsp;
          {#if auth.isAuthenticated && !isAuthor}
            <button
              class="btn btn-sm btn-outline-primary"
              onclick={(e) => { e.preventDefault(); toggleFavorite() }}
            >
              <i class="ion-heart"></i>
              &nbsp; Favorite Post <span class="counter">({article.favoritesCount})</span>
            </button>
          {/if}
          {#if isAuthor}
            <RouterLink class="btn btn-sm btn-outline-secondary" href="/editor/{article.slug}">
              <i class="ion-edit"></i> Edit Article
            </RouterLink>
          {/if}
          {#if isAuthor}
            <button
              class="btn btn-sm btn-outline-danger"
              onclick={(e) => { e.preventDefault(); deleteArticle() }}
            >
              <i class="ion-trash-a"></i> Delete Article
            </button>
          {/if}
        </div>
      </div>
    </div>
    <div class="container page">
      <div class="row article-content">
        <div class="col-md-12">
          <div>{@html renderMarkdown(article.body)}</div>
          <ul class="tag-list">
            {#each article.tagList as tag (tag)}
              <li class="tag-default tag-pill tag-outline">{tag}</li>
            {/each}
          </ul>
        </div>
      </div>
      <hr />
      <div class="article-actions">
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
          <FollowButton username={article.author.username} {following} onupdate={onFollowUpdate} />
          &nbsp;
          {#if auth.isAuthenticated && !isAuthor}
            <button
              class="btn btn-sm btn-outline-primary"
              onclick={(e) => { e.preventDefault(); toggleFavorite() }}
            >
              <i class="ion-heart"></i>
              &nbsp; Favorite Article <span class="counter">({article.favoritesCount})</span>
            </button>
          {/if}
          {#if isAuthor}
            <RouterLink class="btn btn-sm btn-outline-secondary" href="/editor/{article.slug}">
              <i class="ion-edit"></i> Edit Article
            </RouterLink>
          {/if}
          {#if isAuthor}
            <button
              class="btn btn-sm btn-outline-danger"
              onclick={(e) => { e.preventDefault(); deleteArticle() }}
            >
              <i class="ion-trash-a"></i> Delete Article
            </button>
          {/if}
        </div>
      </div>
      <CommentSection {slug} />
    </div>
  </div>
{/if}
