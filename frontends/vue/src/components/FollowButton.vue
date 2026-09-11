<script setup lang="ts">
import { api } from '@/api'
import { useAuth } from '@/stores/auth'

const props = defineProps<{
  username: string
  following: boolean
}>()

const emit = defineEmits<{
  update: [following: boolean]
}>()

const auth = useAuth()

async function toggle() {
  if (!auth.isAuthenticated) return
  const { profile } = props.following
    ? await api.unfollow(props.username)
    : await api.follow(props.username)
  emit('update', profile.following)
}
</script>

<template>
  <button
    v-if="auth.isAuthenticated && auth.user?.username !== username"
    class="btn btn-sm btn-outline-secondary action-btn"
    @click.prevent="toggle"
  >
    <i :class="following ? 'ion-minus-round' : 'ion-plus-round'"></i>
    &nbsp; {{ following ? 'Unfollow' : 'Follow' }} {{ username }}
  </button>
</template>
