<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError, formatErrors } from '@/api'
import { useAuth } from '@/stores/auth'

const auth = useAuth()
const router = useRouter()

const image = ref('')
const username = ref('')
const bio = ref('')
const email = ref('')
const password = ref('')
const errors = ref<string[]>([])

onMounted(() => {
  if (auth.user) {
    image.value = auth.user.image
    username.value = auth.user.username
    bio.value = auth.user.bio
    email.value = auth.user.email
  }
})

async function submit() {
  errors.value = []
  try {
    const data: Record<string, string> = {
      image: image.value,
      username: username.value,
      bio: bio.value,
      email: email.value,
    }
    if (password.value) {
      data.password = password.value
    }
    await auth.updateUser(data)
    router.push(`/profile/${auth.user?.username}`)
  } catch (e) {
    if (e instanceof ApiError) {
      errors.value = formatErrors(e.errors)
    }
  }
}

function doLogout() {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <div class="settings-page">
    <div class="container page">
      <div class="row">
        <div class="col-md-6 offset-md-3 col-xs-12">
          <h1 class="text-xs-center">Your Settings</h1>
          <ul v-if="errors.length" class="error-messages">
            <li v-for="(err, i) in errors" :key="i">{{ err }}</li>
          </ul>
          <form @submit.prevent="submit">
            <fieldset>
              <fieldset class="form-group">
                <input
                  v-model="image"
                  class="form-control"
                  type="text"
                  placeholder="URL of profile picture"
                />
              </fieldset>
              <fieldset class="form-group">
                <input
                  v-model="username"
                  class="form-control form-control-lg"
                  type="text"
                  placeholder="Your Name"
                />
              </fieldset>
              <fieldset class="form-group">
                <textarea
                  v-model="bio"
                  class="form-control form-control-lg"
                  rows="8"
                  placeholder="Short bio about you"
                ></textarea>
              </fieldset>
              <fieldset class="form-group">
                <input
                  v-model="email"
                  class="form-control form-control-lg"
                  type="text"
                  placeholder="Email"
                />
              </fieldset>
              <fieldset class="form-group">
                <input
                  v-model="password"
                  class="form-control form-control-lg"
                  type="password"
                  placeholder="New Password"
                />
              </fieldset>
              <button class="btn btn-lg btn-primary pull-xs-right">Update Settings</button>
            </fieldset>
          </form>
          <hr />
          <button class="btn btn-outline-danger" @click="doLogout">Or click here to logout.</button>
        </div>
      </div>
    </div>
  </div>
</template>
