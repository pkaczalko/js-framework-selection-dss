<script setup lang="ts">
import type { Article, Profile } from '~/types'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const api = useApi()
const config = useRuntimeConfig()

const username = computed(() => route.params.username as string)

const currentPage = computed(() => {
  const q = route.query.page
  const parsed = q ? parseInt(String(q), 10) : 1
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
})

const limit = 10
const offset = computed(() => (currentPage.value - 1) * limit)

const { data: profileData } = await useAsyncData(
  () => `profile-${username.value}`,
  () =>
    $fetch<{ profile: Profile }>(`${config.public.apiUrl}/profiles/${username.value}`).catch(
      () => null,
    ),
)

const profile = ref<Profile | null>(profileData.value?.profile ?? null)
const articles = ref<Article[]>([])
const total = ref(0)
const loading = ref(true)

const isOwnProfile = computed(() => auth.user.value?.username === username.value)

watch(profileData, (data) => {
  profile.value = data?.profile ?? null
})

async function loadArticles() {
  loading.value = true
  try {
    const response = await api.getArticles({
      limit,
      offset: offset.value,
      favorited: username.value,
    })
    articles.value = response.articles
    total.value = response.articlesCount
  } catch {
    articles.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onFollowUpdate(following: boolean) {
  if (profile.value) {
    profile.value.following = following
  }
}

function onPageChange(page: number) {
  router.push({ query: { ...route.query, page: page === 1 ? undefined : String(page) } })
}

function onFavoriteUpdate(updated: Article) {
  articles.value = articles.value.map((a) => (a.slug === updated.slug ? updated : a))
}

watch([username, offset], () => {
  if (profileData.value?.profile === undefined && !profile.value) {
    api.getProfile(username.value).then(({ profile: fetched }) => {
      profile.value = fetched
    }).catch(() => {
      profile.value = null
    })
  }
  loadArticles()
}, { immediate: true })
</script>

<template>
  <div v-if="profile" class="profile-page">
    <div class="user-info">
      <div class="container">
        <div class="row">
          <div class="col-xs-12 col-md-10 offset-md-1">
            <img :src="profile.image" class="user-img" />
            <h4>{{ profile.username }}</h4>
            <p>{{ profile.bio }}</p>
            <FollowButton
              :username="profile.username"
              :following="profile.following"
              @update="onFollowUpdate"
            />
            <NuxtLink
              v-if="isOwnProfile"
              class="btn btn-sm btn-outline-secondary action-btn"
              to="/settings"
            >
              <i class="ion-gear-a"></i>
              &nbsp; Edit Profile Settings
            </NuxtLink>
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
                <NuxtLink
                  class="nav-link"
                  :to="`/profile/${username}`"
                >
                  My Articles
                </NuxtLink>
              </li>
              <li class="nav-item">
                <NuxtLink
                  class="nav-link active"
                  :to="`/profile/${username}/favorites`"
                >
                  Favorited Articles
                </NuxtLink>
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
      </div>
    </div>
  </div>
</template>
