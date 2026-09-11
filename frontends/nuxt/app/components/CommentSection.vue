<script setup lang="ts">
import { marked } from 'marked'
import type { Comment } from '~/types'
import { ApiError, formatErrors } from '~/composables/useApi'
import { formatDate } from '~/utils/date'

const props = defineProps<{
  slug: string
}>()

const auth = useAuth()
const api = useApi()

const comments = ref<Comment[]>([])
const body = ref('')
const errors = ref<string[]>([])
const loading = ref(true)

async function loadComments() {
  loading.value = true
  try {
    const { comments: fetched } = await api.getComments(props.slug)
    comments.value = fetched
  } catch {
    comments.value = []
  } finally {
    loading.value = false
  }
}

async function postComment() {
  errors.value = []
  try {
    const { comment } = await api.addComment(props.slug, body.value)
    comments.value.unshift(comment)
    body.value = ''
  } catch (e) {
    if (e instanceof ApiError) {
      errors.value = formatErrors(e.errors)
    }
  }
}

async function deleteComment(id: number) {
  await api.deleteComment(props.slug, id)
  comments.value = comments.value.filter((c) => c.id !== id)
}

function renderMarkdown(text: string) {
  return marked.parse(text) as string
}

watch(() => props.slug, loadComments, { immediate: true })
</script>

<template>
  <div class="row">
    <div class="col-xs-12 col-md-8 offset-md-2">
      <form
        v-if="auth.isAuthenticated.value && auth.user.value"
        class="card comment-form"
        @submit.prevent="postComment"
      >
        <ul v-if="errors.length" class="error-messages">
          <li v-for="(err, i) in errors" :key="i">{{ err }}</li>
        </ul>
        <div class="card-block">
          <textarea
            v-model="body"
            class="form-control"
            placeholder="Write a comment..."
            rows="3"
          ></textarea>
        </div>
        <div class="card-footer">
          <img :src="auth.user.value.image" class="comment-author-img" />
          <button class="btn btn-sm btn-primary">Post Comment</button>
        </div>
      </form>

      <div v-if="loading">Loading comments...</div>

      <div v-for="comment in comments" :key="comment.id" class="card">
        <div class="card-block">
          <p class="card-text" v-html="renderMarkdown(comment.body)"></p>
        </div>
        <div class="card-footer">
          <NuxtLink :to="`/profile/${comment.author.username}`" class="comment-author">
            <img :src="comment.author.image" class="comment-author-img" />
          </NuxtLink>
          &nbsp;
          <NuxtLink :to="`/profile/${comment.author.username}`" class="comment-author">
            {{ comment.author.username }}
          </NuxtLink>
          <span class="date-posted">{{ formatDate(comment.createdAt) }}</span>
          <span
            v-if="auth.user.value?.username === comment.author.username"
            class="mod-options"
            @click="deleteComment(comment.id)"
          >
            <i class="ion-trash-a"></i>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
