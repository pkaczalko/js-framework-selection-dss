import type { Component } from 'svelte'
import { initAuth, auth } from '@/lib/auth.svelte'
import HomeView from '@/views/HomeView.svelte'
import LoginView from '@/views/LoginView.svelte'
import RegisterView from '@/views/RegisterView.svelte'
import SettingsView from '@/views/SettingsView.svelte'
import EditorView from '@/views/EditorView.svelte'
import ArticleView from '@/views/ArticleView.svelte'
import ProfileView from '@/views/ProfileView.svelte'

export interface RouteMeta {
  requiresAuth?: boolean
  guestOnly?: boolean
}

export interface RouteMatch {
  name: string
  params: Record<string, string>
  query: Record<string, string>
  path: string
}

interface CompiledRoute {
  path: string
  name: string
  pattern: RegExp
  paramNames: string[]
  meta: RouteMeta
  component: Component
}

function compilePath(path: string): { pattern: RegExp; paramNames: string[] } {
  const paramNames: string[] = []
  const regexStr = path.replace(/:([^/]+)/g, (_, name: string) => {
    paramNames.push(name)
    return '([^/]+)'
  })
  return { pattern: new RegExp(`^${regexStr}$`), paramNames }
}

const routeDefs: Array<{
  path: string
  name: string
  meta?: RouteMeta
  component: Component
}> = [
  { path: '/profile/:username/favorites', name: 'profile-favorites', component: ProfileView },
  { path: '/profile/:username', name: 'profile', component: ProfileView },
  { path: '/editor/:slug', name: 'editor-edit', meta: { requiresAuth: true }, component: EditorView },
  { path: '/editor', name: 'editor', meta: { requiresAuth: true }, component: EditorView },
  { path: '/article/:slug', name: 'article', component: ArticleView },
  { path: '/settings', name: 'settings', meta: { requiresAuth: true }, component: SettingsView },
  { path: '/login', name: 'login', meta: { guestOnly: true }, component: LoginView },
  { path: '/register', name: 'register', meta: { guestOnly: true }, component: RegisterView },
  { path: '/', name: 'home', component: HomeView },
]

const routes: CompiledRoute[] = routeDefs.map((def) => {
  const { pattern, paramNames } = compilePath(def.path)
  return {
    ...def,
    pattern,
    paramNames,
    meta: def.meta ?? {},
  }
})

function currentSearch(): string {
  return typeof window === 'undefined' ? '' : window.location.search
}

export const router = $state({
  route: {
    name: 'home',
    params: {},
    query: parseQuery(currentSearch()),
    path: '/',
  } as RouteMatch,
  component: HomeView as Component,
})

function parseQuery(search: string): Record<string, string> {
  const query: Record<string, string> = {}
  const params = new URLSearchParams(search)
  params.forEach((value, key) => {
    query[key] = value
  })
  return query
}

function matchRoute(pathname: string): { route: CompiledRoute; params: Record<string, string> } | null {
  for (const r of routes) {
    const match = pathname.match(r.pattern)
    if (match) {
      const params: Record<string, string> = {}
      r.paramNames.forEach((name, i) => {
        params[name] = match[i + 1] ?? ''
      })
      return { route: r, params }
    }
  }
  return null
}

async function resolve(pathname: string, search: string): Promise<void> {
  const matched = matchRoute(pathname)
  if (!matched) {
    navigate('/', undefined, true)
    return
  }

  const { route: matchedRoute, params } = matched

  if (matchedRoute.meta.requiresAuth && !auth.isAuthenticated) {
    navigate('/login', undefined, true)
    return
  }

  if (matchedRoute.meta.guestOnly && auth.isAuthenticated) {
    navigate('/', undefined, true)
    return
  }

  router.route = {
    name: matchedRoute.name,
    params,
    query: parseQuery(search),
    path: pathname,
  }
  router.component = matchedRoute.component
}

export function navigate(
  to: string | { path: string; query?: Record<string, string | undefined> },
  replace = false,
  skipHistory = false,
): void {
  let path: string
  let query: Record<string, string | undefined> | undefined

  if (typeof to === 'string') {
    const url = new URL(to, window.location.origin)
    path = url.pathname
    query = Object.fromEntries(url.searchParams.entries())
  } else {
    path = to.path
    query = to.query
  }

  const searchParams = new URLSearchParams()
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        searchParams.set(key, value)
      }
    }
  }
  const search = searchParams.toString()
  const fullPath = search ? `${path}?${search}` : path

  if (!skipHistory) {
    if (replace) {
      history.replaceState(null, '', fullPath)
    } else {
      history.pushState(null, '', fullPath)
    }
  }

  void resolve(path, search ? `?${search}` : '')
}

export function replace(
  to: string | { path: string; query?: Record<string, string | undefined> },
): void {
  navigate(to, true)
}

export function startRouter(): void {
  window.addEventListener('popstate', () => {
    void resolve(window.location.pathname, window.location.search)
  })

  void initAuth().then(() => {
    void resolve(window.location.pathname, window.location.search)
  })
}

export function isActive(href: string): boolean {
  const url = new URL(href, window.location.origin)
  return router.route.path === url.pathname
}

export function isActivePrefix(prefix: string): boolean {
  return router.route.path.startsWith(prefix)
}
