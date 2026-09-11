<script setup lang="ts">
import { ApiError, formatErrors } from '~/composables/useApi'

definePageMeta({
  middleware: 'auth',
})

const auth = useAuth()
const router = useRouter()
const api = useApi()

const title = ref('')
const description = ref('')
const body = ref('')
const tagInput = ref('')
const tagList = ref<string[]>([])
const errors = ref<string[]>([])

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !tagList.value.includes(tag)) {
    tagList.value.push(tag)
  }
  tagInput.value = ''
}

function removeTag(tag: string) {
  tagList.value = tagList.value.filter((t) => t !== tag)
}

function onTagKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    addTag()
  }
}

async function submit() {
  errors.value = []
  const articleData = {
    title: title.value,
    description: description.value,
    body: body.value,
    tagList: tagList.value,
  }
  try {
    const { article } = await api.createArticle(articleData)
    router.push(`/article/${article.slug}`)
  } catch (e) {
    if (e instanceof ApiError) {
      errors.value = formatErrors(e.errors)
    }
  }
}
</script>

<template>
  <div class="editor-page">
    <div class="container page">
      <div class="row">
        <div class="col-md-10 offset-md-1 col-xs-12">
          <ul v-if="errors.length" class="error-messages">
            <li v-for="(err, i) in errors" :key="i">{{ err }}</li>
          </ul>
          <form @submit.prevent="submit">
            <fieldset>
              <fieldset class="form-group">
                <input
                  v-model="title"
                  type="text"
                  class="form-control form-control-lg"
                  placeholder="Article Title"
                />
              </fieldset>
              <fieldset class="form-group">
                <input
                  v-model="description"
                  type="text"
                  class="form-control"
                  placeholder="What's this article about?"
                />
              </fieldset>
              <fieldset class="form-group">
                <textarea
                  v-model="body"
                  class="form-control"
                  rows="8"
                  placeholder="Write your article (in markdown)"
                ></textarea>
              </fieldset>
              <fieldset class="form-group">
                <input
                  v-model="tagInput"
                  type="text"
                  class="form-control"
                  placeholder="Enter tags"
                  @keydown="onTagKeydown"
                />
                <div class="tag-list">
                  <span
                    v-for="tag in tagList"
                    :key="tag"
                    class="tag-default tag-pill"
                    @click="removeTag(tag)"
                  >
                    <i class="ion-close-round"></i> {{ tag }}
                  </span>
                </div>
              </fieldset>
              <button class="btn btn-lg pull-xs-right btn-primary" type="submit">
                Publish Article
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
