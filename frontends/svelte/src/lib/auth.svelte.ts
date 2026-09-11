import { api } from '@/lib/api'
import type { User } from '@/lib/types'

export const auth = $state({
  user: null as User | null,
  isAuthenticated: false,
  ready: false,
})

let initPromise: Promise<void> | null = null

async function initialize(): Promise<void> {
  if (auth.ready) return
  if (initPromise) return initPromise

  initPromise = (async () => {
    const token = localStorage.getItem('jwt')
    if (token) {
      try {
        const { user: fetched } = await api.getCurrentUser()
        auth.user = fetched
        auth.isAuthenticated = true
      } catch {
        localStorage.removeItem('jwt')
        auth.user = null
        auth.isAuthenticated = false
      }
    }
    auth.ready = true
  })()

  return initPromise
}

function setUser(next: User) {
  localStorage.setItem('jwt', next.token)
  auth.user = next
  auth.isAuthenticated = true
}

export async function login(email: string, password: string) {
  const { user: fetched } = await api.login({ email, password })
  setUser(fetched)
  return fetched
}

export async function register(username: string, email: string, password: string) {
  const { user: fetched } = await api.register({ username, email, password })
  setUser(fetched)
  return fetched
}

export function logout() {
  localStorage.removeItem('jwt')
  auth.user = null
  auth.isAuthenticated = false
}

export async function updateUser(data: Partial<User>) {
  const { user: fetched } = await api.updateUser(data)
  localStorage.setItem('jwt', fetched.token)
  auth.user = fetched
  return fetched
}

export function initAuth(): Promise<void> {
  return initialize()
}
