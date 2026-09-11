<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  total: number
  limit: number
  currentPage: number
}>()

const emit = defineEmits<{
  'page-change': [page: number]
}>()

const totalPages = computed(() => Math.ceil(props.total / props.limit))

function goTo(page: number) {
  if (page >= 1 && page <= totalPages.value && page !== props.currentPage) {
    emit('page-change', page)
  }
}
</script>

<template>
  <ul v-if="totalPages > 1" class="pagination">
    <li
      v-for="page in totalPages"
      :key="page"
      class="page-item"
      :class="{ active: page === currentPage }"
    >
      <a class="page-link" href="" @click.prevent="goTo(page)">{{ page }}</a>
    </li>
  </ul>
</template>
