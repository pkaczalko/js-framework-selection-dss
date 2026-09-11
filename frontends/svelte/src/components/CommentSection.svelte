<script lang="ts">
  import { marked } from 'marked'
  import type { Comment } from '@/lib/types'
  import { api, ApiError, formatErrors } from '@/lib/api'
  import { formatDate } from '@/lib/utils/date'
  import { auth } from '@/lib/auth.svelte'
  import RouterLink from '@/lib/RouterLink.svelte'

  interface Props {
    slug: string
  }

  let { slug }: Props = $props()

  let comments = $state<Comment[]>([])
  let body = $state('')
  let errors = $state<string[]>([])
  let loading = $state(true)

  async function loadComments() {
    loading = true
    try {
      const { comments: fetched } = await api.getComments(slug)
      comments = fetched
    } catch {
      comments = []
    } finally {
      loading = false
    }
  }

  async function postComment() {
    errors = []
    try {
      const { comment } = await api.addComment(slug, body)
      comments = [comment, ...comments]
      body = ''
    } catch (e) {
      if (e instanceof ApiError) {
        errors = formatErrors(e.errors)
      }
    }
  }

  async function deleteComment(id: number) {
    await api.deleteComment(slug, id)
    comments = comments.filter((c) => c.id !== id)
  }

  function renderMarkdown(text: string) {
    return marked.parse(text) as string
  }

  $effect(() => {
    slug
    void loadComments()
  })
</script>

<div class="row">
  <div class="col-xs-12 col-md-8 offset-md-2">
    {#if auth.isAuthenticated && auth.user}
      <form class="card comment-form" onsubmit={(e) => { e.preventDefault(); postComment() }}>
        {#if errors.length}
          <ul class="error-messages">
            {#each errors as err, i (i)}
              <li>{err}</li>
            {/each}
          </ul>
        {/if}
        <div class="card-block">
          <textarea
            bind:value={body}
            class="form-control"
            placeholder="Write a comment..."
            rows="3"
          ></textarea>
        </div>
        <div class="card-footer">
          <img src={auth.user.image} class="comment-author-img" alt="" />
          <button class="btn btn-sm btn-primary">Post Comment</button>
        </div>
      </form>
    {/if}

    {#if loading}
      <div>Loading comments...</div>
    {/if}

    {#each comments as comment (comment.id)}
      <div class="card">
        <div class="card-block">
          <p class="card-text">{@html renderMarkdown(comment.body)}</p>
        </div>
        <div class="card-footer">
          <RouterLink href="/profile/{comment.author.username}" class="comment-author">
            <img src={comment.author.image} class="comment-author-img" alt="" />
          </RouterLink>
          &nbsp;
          <RouterLink href="/profile/{comment.author.username}" class="comment-author">
            {comment.author.username}
          </RouterLink>
          <span class="date-posted">{formatDate(comment.createdAt)}</span>
          {#if auth.user?.username === comment.author.username}
            <span class="mod-options" onclick={() => deleteComment(comment.id)}>
              <i class="ion-trash-a"></i>
            </span>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
