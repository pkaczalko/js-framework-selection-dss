export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth()
  if (!auth.ready.value) {
    await auth.initialize()
  }
  if (!auth.isAuthenticated.value) {
    return navigateTo('/login')
  }
})
