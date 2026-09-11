<script setup lang="ts">
import type { Article } from '~/types'

defineProps<{
  articles: Article[]
  total: number
  limit: number
  currentPage: number
  loading: boolean
}>()

const emit = defineEmits<{
  'page-change': [page: number]
  update: [article: Article]
}>()
</script>

<template>
  <div v-if="loading">Loading...</div>
  <template v-else>
    <div v-if="articles.length === 0" class="empty-feed-message">No articles are here... yet.</div>
    <ArticlePreview
      v-for="article in articles"
      :key="article.slug"
      :article="article"
      @update="emit('update', $event)"
    />
    <Pagination
      :total="total"
      :limit="limit"
      :current-page="currentPage"
      @page-change="emit('page-change', $event)"
    />
  </template>
</template>
