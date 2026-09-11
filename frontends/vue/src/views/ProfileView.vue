<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/api'
import type { Article, Profile } from '@/types'
import { useAuth } from '@/stores/auth'
import FollowButton from '@/components/FollowButton.vue'
import ArticleList from '@/components/ArticleList.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const profile = ref<Profile | null>(null)
const articles = ref<Article[]>([])
const total = ref(0)
const loading = ref(true)

const username = computed(() => route.params.username as string)
const isFavorites = computed(() => route.name === 'profile-favorites')
const isOwnProfile = computed(() => auth.user?.username === username.value)

const currentPage = computed(() => {
  const q = route.query.page
  const parsed = q ? parseInt(String(q), 10) : 1
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
})

const limit = 10
const offset = computed(() => (currentPage.value - 1) * limit)

async function loadProfile() {
  try {
    const { profile: fetched } = await api.getProfile(username.value)
    profile.value = fetched
  } catch {
    profile.value = null
  }
}

async function loadArticles() {
  loading.value = true
  try {
    const params: Record<string, string | number> = {
      limit,
      offset: offset.value,
    }
    if (isFavorites.value) {
      params.favorited = username.value
    } else {
      params.author = username.value
    }
    const response = await api.getArticles(params)
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

watch([username, isFavorites, offset], () => {
  loadProfile()
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
            <RouterLink
              v-if="isOwnProfile"
              class="btn btn-sm btn-outline-secondary action-btn"
              to="/settings"
            >
              <i class="ion-gear-a"></i>
              &nbsp; Edit Profile Settings
            </RouterLink>
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
                  :class="{ active: !isFavorites }"
                  :to="`/profile/${username}`"
                >
                  My Articles
                </RouterLink>
              </li>
              <li class="nav-item">
                <RouterLink
                  class="nav-link"
                  :class="{ active: isFavorites }"
                  :to="`/profile/${username}/favorites`"
                >
                  Favorited Articles
                </RouterLink>
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
