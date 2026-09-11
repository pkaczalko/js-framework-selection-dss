<script setup lang="ts">
import { computed } from 'vue'
import type { Article } from '@/types'
import { api } from '@/api'
import { useAuth } from '@/stores/auth'

const props = defineProps<{
  article: Article
}>()

const emit = defineEmits<{
  update: [article: Article]
}>()

const auth = useAuth()

const isFavorited = computed(() => props.article.favorited)
const count = computed(() => props.article.favoritesCount)

async function toggle() {
  if (!auth.isAuthenticated) return
  const { article } = isFavorited.value
    ? await api.unfavorite(props.article.slug)
    : await api.favorite(props.article.slug)
  emit('update', article)
}
</script>

<template>
  <button
    v-if="auth.isAuthenticated"
    class="btn btn-outline-primary btn-sm pull-xs-right"
    :class="{ active: isFavorited }"
    @click.prevent="toggle"
  >
    <i class="ion-heart"></i> {{ count }}
  </button>
</template>
