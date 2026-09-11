<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/api'

const tags = ref<string[]>([])
const router = useRouter()
const route = useRoute()

onMounted(async () => {
  try {
    const { tags: fetched } = await api.getTags()
    tags.value = fetched
  } catch {
    tags.value = []
  }
})

function selectTag(tag: string) {
  router.push({ path: '/', query: { ...route.query, tag, page: undefined } })
}
</script>

<template>
  <div class="sidebar">
    <p>Popular Tags</p>
    <div class="tag-list">
      <a
        v-for="tag in tags"
        :key="tag"
        href=""
        class="tag-pill tag-default"
        @click.prevent="selectTag(tag)"
      >
        {{ tag }}
      </a>
    </div>
  </div>
</template>
