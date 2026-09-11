import type { User } from '~/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  ready: boolean
}

let initPromise: Promise<void> | null = null

export function useAuth() {
  const state = useState<AuthState>('auth', () => ({
    user: null,
    isAuthenticated: false,
    ready: false,
  }))

  const api = useApi()

  async function initialize(): Promise<void> {
    if (state.value.ready) return
    if (initPromise) return initPromise

    initPromise = (async () => {
      if (import.meta.server) {
        state.value.ready = true
        return
      }

      const token = localStorage.getItem('jwt')
      if (token) {
        try {
          const { user } = await api.getCurrentUser()
          state.value.user = user
          state.value.isAuthenticated = true
        } catch {
          localStorage.removeItem('jwt')
          state.value.user = null
          state.value.isAuthenticated = false
        }
      }
      state.value.ready = true
    })()

    return initPromise
  }

  function setUser(user: User) {
    localStorage.setItem('jwt', user.token)
    state.value.user = user
    state.value.isAuthenticated = true
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
    state.value.user = null
    state.value.isAuthenticated = false
  }

  async function updateUser(data: Partial<User>) {
    const { user } = await api.updateUser(data)
    localStorage.setItem('jwt', user.token)
    state.value.user = user
    return user
  }

  return {
    user: computed(() => state.value.user),
    isAuthenticated: computed(() => state.value.isAuthenticated),
    ready: computed(() => state.value.ready),
    initialize,
    login,
    register,
    logout,
    updateUser,
  }
}
