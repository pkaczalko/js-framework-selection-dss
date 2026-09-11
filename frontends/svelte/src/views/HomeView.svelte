<script lang="ts">
  import { api } from '@/lib/api'
  import type { Article } from '@/lib/types'
  import { auth } from '@/lib/auth.svelte'
  import { router, navigate } from '@/lib/router.svelte'
  import ArticleList from '@/components/ArticleList.svelte'
  import TagList from '@/components/TagList.svelte'

  let articles = $state<Article[]>([])
  let total = $state(0)
  let loading = $state(true)
  type FeedTab = 'global' | 'feed' | 'tag'
  let activeTab = $state<FeedTab>('global')

  const limit = $derived.by(() => {
    const q = router.route.query.limit
    const parsed = q ? parseInt(String(q), 10) : 10
    return Number.isNaN(parsed) ? 10 : parsed
  })

  const currentPage = $derived.by(() => {
    const q = router.route.query.page
    const parsed = q ? parseInt(String(q), 10) : 1
    return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
  })

  const offset = $derived((currentPage - 1) * limit)

  const activeTag = $derived(router.route.query.tag ? String(router.route.query.tag) : null)

  $effect(() => {
    if (activeTag) {
      activeTab = 'tag'
    } else if (activeTab === 'tag') {
      activeTab = 'global'
    }
  })

  let loadSeq = 0

  async function loadArticles() {
    const seq = ++loadSeq
    loading = true
    try {
      let response
      if (activeTab === 'feed' && auth.isAuthenticated) {
        response = await api.getFeed(limit, offset)
      } else if (activeTab === 'tag' && activeTag) {
        response = await api.getArticles({
          limit,
          offset,
          tag: activeTag,
        })
      } else {
        response = await api.getArticles({
          limit,
          offset,
        })
      }
      if (seq !== loadSeq) return
      articles = response.articles
      total = response.articlesCount
    } catch {
      if (seq !== loadSeq) return
      articles = []
      total = 0
    } finally {
      if (seq === loadSeq) loading = false
    }
  }

  function setTab(tab: FeedTab) {
    activeTab = tab
    if (tab !== 'tag') {
      const query = { ...router.route.query }
      delete query.tag
      delete query.page
      navigate({ path: '/', query })
    }
  }

  function onPageChange(page: number) {
    navigate({
      path: '/',
      query: { ...router.route.query, page: page === 1 ? undefined : String(page) },
    })
  }

  function onFavoriteUpdate(updated: Article) {
    articles = articles.map((a) => (a.slug === updated.slug ? updated : a))
  }

  $effect(() => {
    activeTab
    limit
    offset
    activeTag
    void loadArticles()
  })
</script>

<div class="home-page">
  <div class="banner">
    <div class="container">
      <h1 class="logo-font">conduit</h1>
      <p>A place to share your knowledge.</p>
    </div>
  </div>
  <div class="container page">
    <div class="row">
      <div class="col-md-9">
        <div class="feed-toggle">
          <ul class="nav nav-pills outline-active">
            {#if auth.isAuthenticated}
              <li class="nav-item">
                <a
                  class="nav-link"
                  class:active={activeTab === 'feed'}
                  href=""
                  onclick={(e) => { e.preventDefault(); setTab('feed') }}
                >
                  Your Feed
                </a>
              </li>
            {/if}
            <li class="nav-item">
              <a
                class="nav-link"
                class:active={activeTab === 'global'}
                href=""
                onclick={(e) => { e.preventDefault(); setTab('global') }}
              >
                Global Feed
              </a>
            </li>
            {#if activeTag}
              <li class="nav-item">
                <a class="nav-link active" href="">
                  #{activeTag}
                </a>
              </li>
            {/if}
          </ul>
        </div>
        <ArticleList
          {articles}
          {total}
          {limit}
          {currentPage}
          {loading}
          onpagechange={onPageChange}
          onupdate={onFavoriteUpdate}
        />
      </div>
      <div class="col-md-3">
        <TagList />
      </div>
    </div>
  </div>
</div>
