<script lang="ts">
  import { onMount } from 'svelte'
  import { api, ApiError, formatErrors } from '@/lib/api'
  import { auth } from '@/lib/auth.svelte'
  import { router, navigate, replace } from '@/lib/router.svelte'

  const isEdit = $derived(!!router.route.params.slug)

  let title = $state('')
  let description = $state('')
  let body = $state('')
  let tagInput = $state('')
  let tagList = $state<string[]>([])
  let errors = $state<string[]>([])

  onMount(async () => {
    if (isEdit) {
      const slug = router.route.params.slug
      try {
        const { article } = await api.getArticle(slug)
        if (article.author.username !== auth.user?.username) {
          replace('/')
          return
        }
        title = article.title
        description = article.description
        body = article.body
        tagList = [...article.tagList]
      } catch {
        replace('/')
      }
    }
  })

  function addTag() {
    const tag = tagInput.trim()
    if (tag && !tagList.includes(tag)) {
      tagList = [...tagList, tag]
    }
    tagInput = ''
  }

  function removeTag(tag: string) {
    tagList = tagList.filter((t) => t !== tag)
  }

  function onTagKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  async function submit() {
    errors = []
    const articleData = {
      title,
      description,
      body,
      tagList,
    }
    try {
      if (isEdit) {
        const { article } = await api.updateArticle(router.route.params.slug, articleData)
        navigate(`/article/${article.slug}`)
      } else {
        const { article } = await api.createArticle(articleData)
        navigate(`/article/${article.slug}`)
      }
    } catch (e) {
      if (e instanceof ApiError) {
        errors = formatErrors(e.errors)
      }
    }
  }
</script>

<div class="editor-page">
  <div class="container page">
    <div class="row">
      <div class="col-md-10 offset-md-1 col-xs-12">
        {#if errors.length}
          <ul class="error-messages">
            {#each errors as err, i (i)}
              <li>{err}</li>
            {/each}
          </ul>
        {/if}
        <form onsubmit={(e) => { e.preventDefault(); submit() }}>
          <fieldset>
            <fieldset class="form-group">
              <input
                bind:value={title}
                type="text"
                class="form-control form-control-lg"
                placeholder="Article Title"
              />
            </fieldset>
            <fieldset class="form-group">
              <input
                bind:value={description}
                type="text"
                class="form-control"
                placeholder="What's this article about?"
              />
            </fieldset>
            <fieldset class="form-group">
              <textarea
                bind:value={body}
                class="form-control"
                rows="8"
                placeholder="Write your article (in markdown)"
              ></textarea>
            </fieldset>
            <fieldset class="form-group">
              <input
                bind:value={tagInput}
                type="text"
                class="form-control"
                placeholder="Enter tags"
                onkeydown={onTagKeydown}
              />
              <div class="tag-list">
                {#each tagList as tag (tag)}
                  <span class="tag-default tag-pill" onclick={() => removeTag(tag)}>
                    <i class="ion-close-round"></i> {tag}
                  </span>
                {/each}
              </div>
            </fieldset>
            <button class="btn btn-lg pull-xs-right btn-primary" type="submit">
              Publish Article
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  </div>
</div>
