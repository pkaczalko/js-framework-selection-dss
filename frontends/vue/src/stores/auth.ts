import { reactive } from 'vue'
import { api } from '@/api'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  ready: boolean
}

const state = reactive<AuthState>({
  user: null,
  isAuthenticated: false,
  ready: false,
})

let initPromise: Promise<void> | null = null

async function initialize(): Promise<void> {
  if (state.ready) return
  if (initPromise) return initPromise

  initPromise = (async () => {
    const token = localStorage.getItem('jwt')
    if (token) {
      try {
        const { user } = await api.getCurrentUser()
        state.user = user
        state.isAuthenticated = true
      } catch {
        localStorage.removeItem('jwt')
        state.user = null
        state.isAuthenticated = false
      }
    }
    state.ready = true
  })()

  return initPromise
}

function setUser(user: User) {
  localStorage.setItem('jwt', user.token)
  state.user = user
  state.isAuthenticated = true
}

async function login(email: string, password: string) {
  const { user } = await api.login({ email, password })
  setUser(user)
  return user
}

async function register(username: string, email: string, password: string) {
  const { user } = await api.register({ username, email, password })
  setUser(user)
  return user
}

function logout() {
  localStorage.removeItem('jwt')
  state.user = null
  state.isAuthenticated = false
}

async function updateUser(data: Partial<User>) {
  const { user } = await api.updateUser(data)
  localStorage.setItem('jwt', user.token)
  state.user = user
  return user
}

export function useAuth() {
  return {
    get user() {
      return state.user
    },
    get isAuthenticated() {
      return state.isAuthenticated
    },
    get ready() {
      return state.ready
    },
    initialize,
    login,
    register,
    logout,
    updateUser,
  }
}

export function initAuth(): Promise<void> {
  return initialize()
}
