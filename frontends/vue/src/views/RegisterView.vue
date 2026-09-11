<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError, formatErrors } from '@/api'
import { useAuth } from '@/stores/auth'

const auth = useAuth()
const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const errors = ref<string[]>([])

async function submit() {
  errors.value = []
  try {
    await auth.register(username.value, email.value, password.value)
    router.push('/')
  } catch (e) {
    if (e instanceof ApiError) {
      errors.value = formatErrors(e.errors)
    }
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="container page">
      <div class="row">
        <div class="col-md-6 offset-md-3 col-xs-12">
          <h1 class="text-xs-center">Sign up</h1>
          <p class="text-xs-center">
            <RouterLink to="/login">Have an account?</RouterLink>
          </p>
          <ul v-if="errors.length" class="error-messages">
            <li v-for="(err, i) in errors" :key="i">{{ err }}</li>
          </ul>
          <form @submit.prevent="submit">
            <fieldset class="form-group">
              <input
                v-model="username"
                class="form-control form-control-lg"
                type="text"
                placeholder="Username"
              />
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
                placeholder="Password"
              />
            </fieldset>
            <button class="btn btn-lg btn-primary pull-xs-right">Sign up</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
