<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { api } from '@/api'
import type { Article } from '@/types'
import { formatDate } from '@/utils/date'
import { useAuth } from '@/stores/auth'
import FollowButton from '@/components/FollowButton.vue'
import CommentSection from '@/components/CommentSection.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const article = ref<Article | null>(null)
const following = ref(false)

const slug = computed(() => route.params.slug as string)
const isAuthor = computed(
  () => auth.user?.username === article.value?.author.username,
)

function renderMarkdown(text: string) {
  return marked.parse(text) as string
}

async function loadArticle() {
  try {
    const { article: fetched } = await api.getArticle(slug.value)
    article.value = fetched
    following.value = fetched.author.following
  } catch {
    router.replace('/')
  }
}

async function toggleFavorite() {
  if (!article.value || !auth.isAuthenticated) return
  const { article: updated } = article.value.favorited
    ? await api.unfavorite(article.value.slug)
    : await api.favorite(article.value.slug)
  article.value = updated
}

async function deleteArticle() {
  if (!article.value) return
  await api.deleteArticle(article.value.slug)
  router.push('/')
}

function onFollowUpdate(value: boolean) {
  following.value = value
  if (article.value) {
    article.value.author.following = value
  }
}

onMounted(loadArticle)
</script>

<template>
  <div v-if="article" class="article-page">
    <div class="banner">
      <div class="container">
        <h1>{{ article.title }}</h1>
        <div class="article-meta">
          <RouterLink :to="`/profile/${article.author.username}`">
            <img :src="article.author.image" />
          </RouterLink>
          <div class="info">
            <RouterLink :to="`/profile/${article.author.username}`" class="author">
              {{ article.author.username }}
            </RouterLink>
            <span class="date">{{ formatDate(article.createdAt) }}</span>
          </div>
          <FollowButton
            :username="article.author.username"
            :following="following"
            @update="onFollowUpdate"
          />
          &nbsp;&nbsp;
          <button
            v-if="auth.isAuthenticated && !isAuthor"
            class="btn btn-sm btn-outline-primary"
            @click.prevent="toggleFavorite"
          >
            <i class="ion-heart"></i>
            &nbsp; Favorite Post <span class="counter">({{ article.favoritesCount }})</span>
          </button>
          <RouterLink
            v-if="isAuthor"
            class="btn btn-sm btn-outline-secondary"
            :to="`/editor/${article.slug}`"
          >
            <i class="ion-edit"></i> Edit Article
          </RouterLink>
          <button
            v-if="isAuthor"
            class="btn btn-sm btn-outline-danger"
            @click.prevent="deleteArticle"
          >
            <i class="ion-trash-a"></i> Delete Article
          </button>
        </div>
      </div>
    </div>
    <div class="container page">
      <div class="row article-content">
        <div class="col-md-12">
          <div v-html="renderMarkdown(article.body)"></div>
          <ul class="tag-list">
            <li
              v-for="tag in article.tagList"
              :key="tag"
              class="tag-default tag-pill tag-outline"
            >
              {{ tag }}
            </li>
          </ul>
        </div>
      </div>
      <hr />
      <div class="article-actions">
        <div class="article-meta">
          <RouterLink :to="`/profile/${article.author.username}`">
            <img :src="article.author.image" />
          </RouterLink>
          <div class="info">
            <RouterLink :to="`/profile/${article.author.username}`" class="author">
              {{ article.author.username }}
            </RouterLink>
            <span class="date">{{ formatDate(article.createdAt) }}</span>
          </div>
          <FollowButton
            :username="article.author.username"
            :following="following"
            @update="onFollowUpdate"
          />
          &nbsp;
          <button
            v-if="auth.isAuthenticated && !isAuthor"
            class="btn btn-sm btn-outline-primary"
            @click.prevent="toggleFavorite"
          >
            <i class="ion-heart"></i>
            &nbsp; Favorite Article <span class="counter">({{ article.favoritesCount }})</span>
          </button>
          <RouterLink
            v-if="isAuthor"
            class="btn btn-sm btn-outline-secondary"
            :to="`/editor/${article.slug}`"
          >
            <i class="ion-edit"></i> Edit Article
          </RouterLink>
          <button
            v-if="isAuthor"
            class="btn btn-sm btn-outline-danger"
            @click.prevent="deleteArticle"
          >
            <i class="ion-trash-a"></i> Delete Article
          </button>
        </div>
      </div>
      <CommentSection :slug="slug" />
    </div>
  </div>
</template>
