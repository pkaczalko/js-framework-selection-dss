<script setup lang="ts">
import type { Article } from '~/types'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const api = useApi()

const articles = ref<Article[]>([])
const total = ref(0)
const loading = ref(true)

const limit = computed(() => {
  const q = route.query.limit
  const parsed = q ? parseInt(String(q), 10) : 10
  return Number.isNaN(parsed) ? 10 : parsed
})

const currentPage = computed(() => {
  const q = route.query.page
  const parsed = q ? parseInt(String(q), 10) : 1
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
})

const offset = computed(() => (currentPage.value - 1) * limit.value)

const activeTag = computed(() => (route.query.tag ? String(route.query.tag) : null))

type FeedTab = 'global' | 'feed' | 'tag'
const activeTab = ref<FeedTab>('global')

watch(
  [activeTag, () => auth.isAuthenticated.value],
  () => {
    if (activeTag.value) {
      activeTab.value = 'tag'
    } else if (activeTab.value === 'tag') {
      activeTab.value = 'global'
    }
  },
  { immediate: true },
)

async function loadArticles() {
  loading.value = true
  try {
    let response
    if (activeTab.value === 'feed' && auth.isAuthenticated.value) {
      response = await api.getFeed(limit.value, offset.value)
    } else if (activeTab.value === 'tag' && activeTag.value) {
      response = await api.getArticles({
        limit: limit.value,
        offset: offset.value,
        tag: activeTag.value,
      })
    } else {
      response = await api.getArticles({
        limit: limit.value,
        offset: offset.value,
      })
    }
    articles.value = response.articles
    total.value = response.articlesCount
  } catch {
    articles.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function setTab(tab: FeedTab) {
  activeTab.value = tab
  if (tab !== 'tag') {
    const query = { ...route.query }
    delete query.tag
    delete query.page
    router.replace({ query })
  }
}

function onPageChange(page: number) {
  router.push({ query: { ...route.query, page: page === 1 ? undefined : String(page) } })
}

function onFavoriteUpdate(updated: Article) {
  articles.value = articles.value.map((a) => (a.slug === updated.slug ? updated : a))
}

watch([activeTab, limit, offset, activeTag], loadArticles, { immediate: true })
</script>

<template>
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
              <li v-if="auth.isAuthenticated.value" class="nav-item">
                <a
                  class="nav-link"
                  :class="{ active: activeTab === 'feed' }"
                  href=""
                  @click.prevent="setTab('feed')"
                >
                  Your Feed
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  :class="{ active: activeTab === 'global' }"
                  href=""
                  @click.prevent="setTab('global')"
                >
                  Global Feed
                </a>
              </li>
              <li v-if="activeTag" class="nav-item">
                <a class="nav-link active" href="">
                  #{{ activeTag }}
                </a>
              </li>
            </ul>
          </div>
          <ArticleList
            :articles="articles"
            :total="total"
            :limit="limit"
            :current-page="currentPage"
            :loading="loading"
            @page-change="onPageChange"
            @update="onFavoriteUpdate"
          />
        </div>
        <div class="col-md-3">
          <TagList />
        </div>
      </div>
    </div>
  </div>
</template>
