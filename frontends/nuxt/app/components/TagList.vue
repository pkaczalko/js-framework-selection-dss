<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const api = useApi()

const tags = ref<string[]>([])

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
