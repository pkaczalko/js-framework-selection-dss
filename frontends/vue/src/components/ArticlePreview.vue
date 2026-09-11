<script setup lang="ts">
import type { Article } from '@/types'
import ArticleMeta from './ArticleMeta.vue'

defineProps<{
  article: Article
}>()

const emit = defineEmits<{
  update: [article: Article]
}>()
</script>

<template>
  <div class="article-preview">
    <ArticleMeta :article="article" @update="emit('update', $event)" />
    <RouterLink :to="`/article/${article.slug}`" class="preview-link">
      <h1>{{ article.title }}</h1>
      <p>{{ article.description }}</p>
      <span>Read more...</span>
      <ul class="tag-list">
        <li v-for="tag in article.tagList" :key="tag" class="tag-default tag-pill tag-outline">
          {{ tag }}
        </li>
      </ul>
    </RouterLink>
  </div>
</template>
