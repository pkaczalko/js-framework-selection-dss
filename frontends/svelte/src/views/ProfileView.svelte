<script lang="ts">
  import { api } from '@/lib/api'
  import type { Article, Profile } from '@/lib/types'
  import { auth } from '@/lib/auth.svelte'
  import { router, navigate } from '@/lib/router.svelte'
  import FollowButton from '@/components/FollowButton.svelte'
  import ArticleList from '@/components/ArticleList.svelte'
  import RouterLink from '@/lib/RouterLink.svelte'

  let profile = $state<Profile | null>(null)
  let articles = $state<Article[]>([])
  let total = $state(0)
  let loading = $state(true)

  const username = $derived(router.route.params.username)
  const isFavorites = $derived(router.route.name === 'profile-favorites')
  const isOwnProfile = $derived(auth.user?.username === username)

  const currentPage = $derived.by(() => {
    const q = router.route.query.page
    const parsed = q ? parseInt(String(q), 10) : 1
    return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
  })

  const limit = 10
  const offset = $derived((currentPage - 1) * limit)

  async function loadProfile() {
    try {
      const { profile: fetched } = await api.getProfile(username)
      profile = fetched
    } catch {
      profile = null
    }
  }

  async function loadArticles() {
    loading = true
    try {
      const params: Record<string, string | number> = {
        limit,
        offset,
      }
      if (isFavorites) {
        params.favorited = username
      } else {
        params.author = username
      }
      const response = await api.getArticles(params)
      articles = response.articles
      total = response.articlesCount
    } catch {
      articles = []
      total = 0
    } finally {
      loading = false
    }
  }

  function onFollowUpdate(following: boolean) {
    if (profile) {
      profile.following = following
    }
  }

  function onPageChange(page: number) {
    navigate({
      path: router.route.path,
      query: { ...router.route.query, page: page === 1 ? undefined : String(page) },
    })
  }

  function onFavoriteUpdate(updated: Article) {
    articles = articles.map((a) => (a.slug === updated.slug ? updated : a))
  }

  $effect(() => {
    username
    isFavorites
    offset
    void loadProfile()
    void loadArticles()
  })
</script>

{#if profile}
  <div class="profile-page">
    <div class="user-info">
      <div class="container">
        <div class="row">
          <div class="col-xs-12 col-md-10 offset-md-1">
            <img src={profile.image} class="user-img" alt="" />
            <h4>{profile.username}</h4>
            <p>{profile.bio}</p>
            <FollowButton
              username={profile.username}
              following={profile.following}
              onupdate={onFollowUpdate}
            />
            {#if isOwnProfile}
              <RouterLink class="btn btn-sm btn-outline-secondary action-btn" href="/settings">
                <i class="ion-gear-a"></i>
                &nbsp; Edit Profile Settings
              </RouterLink>
            {/if}
          </div>
        </div>
      </div>
    </div>
    <div class="container">
      <div class="row">
        <div class="col-xs-12 col-md-10 offset-md-1">
          <div class="articles-toggle">
            <ul class="nav nav-pills outline-active">
              <li class="nav-item">
                <RouterLink
                  class="nav-link"
                  href="/profile/{username}"
                  active={!isFavorites}
                >
                  My Articles
                </RouterLink>
              </li>
              <li class="nav-item">
                <RouterLink
                  class="nav-link"
                  href="/profile/{username}/favorites"
                  active={isFavorites}
                >
                  Favorited Articles
                </RouterLink>
              </li>
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
      </div>
    </div>
  </div>
{/if}
