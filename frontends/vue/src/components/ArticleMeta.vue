<script setup lang="ts">
import type { Article } from '@/types'
import { formatDate } from '@/utils/date'
import FavoriteButton from './FavoriteButton.vue'

defineProps<{
  article: Article
  hideFavorite?: boolean
}>()

const emit = defineEmits<{
  update: [article: Article]
}>()
</script>

<template>
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
    <FavoriteButton
      v-if="!hideFavorite"
      :article="article"
      @update="emit('update', $event)"
    />
  </div>
</template>
