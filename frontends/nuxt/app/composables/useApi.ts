import type {
  ArticlesResponse,
  CommentResponse,
  CommentsResponse,
  ProfileResponse,
  SingleArticleResponse,
  TagsResponse,
  User,
  UserResponse,
} from '~/types'

export class ApiError extends Error {
  errors: Record<string, string[]>

  constructor(errors: Record<string, string[]>) {
    super('Validation error')
    this.errors = errors
  }
}

export function formatErrors(errors: Record<string, string[]>): string[] {
  return Object.entries(errors).flatMap(([field, messages]) =>
    messages.map((msg) => `${field} ${msg}`),
  )
}

function getToken(): string | null {
  if (import.meta.server) return null
  return localStorage.getItem('jwt')
}

export function useApi() {
  const config = useRuntimeConfig()
  const apiUrl = config.public.apiUrl as string

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    }

    const token = getToken()
    if (token) {
      headers['Authorization'] = `Token ${token}`
    }

    const res = await fetch(`${apiUrl}${path}`, { ...options, headers })

    if (res.status === 422) {
      const data = await res.json()
      throw new ApiError(data.errors)
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    if (res.status === 204) {
      return {} as T
    }

    return res.json()
  }

  return {
    register(user: { username: string; email: string; password: string }) {
      return request<UserResponse>('/users', {
        method: 'POST',
        body: JSON.stringify({ user }),
      })
    },

    login(user: { email: string; password: string }) {
      return request<UserResponse>('/users/login', {
        method: 'POST',
        body: JSON.stringify({ user }),
      })
    },

    getCurrentUser() {
      return request<UserResponse>('/user')
    },

    updateUser(user: Partial<User>) {
      return request<UserResponse>('/user', {
        method: 'PUT',
        body: JSON.stringify({ user }),
      })
    },

    getProfile(username: string) {
      return request<ProfileResponse>(`/profiles/${username}`)
    },

    follow(username: string) {
      return request<ProfileResponse>(`/profiles/${username}/follow`, {
        method: 'POST',
      })
    },

    unfollow(username: string) {
      return request<ProfileResponse>(`/profiles/${username}/follow`, {
        method: 'DELETE',
      })
    },

    getArticles(params: Record<string, string | number | undefined> = {}) {
      const query = new URLSearchParams()
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') {
          query.set(key, String(value))
        }
      }
      const qs = query.toString()
      return request<ArticlesResponse>(`/articles${qs ? `?${qs}` : ''}`)
    },

    getFeed(limit: number, offset: number) {
      return request<ArticlesResponse>(
        `/articles/feed?limit=${limit}&offset=${offset}`,
      )
    },

    getArticle(slug: string) {
      return request<SingleArticleResponse>(`/articles/${slug}`)
    },

    createArticle(article: {
      title: string
      description: string
      body: string
      tagList: string[]
    }) {
      return request<SingleArticleResponse>('/articles', {
        method: 'POST',
        body: JSON.stringify({ article }),
      })
    },

    updateArticle(
      slug: string,
      article: {
        title: string
        description: string
        body: string
        tagList: string[]
      },
    ) {
      return request<SingleArticleResponse>(`/articles/${slug}`, {
        method: 'PUT',
        body: JSON.stringify({ article }),
      })
    },

    deleteArticle(slug: string) {
      return request<void>(`/articles/${slug}`, { method: 'DELETE' })
    },

    favorite(slug: string) {
      return request<SingleArticleResponse>(`/articles/${slug}/favorite`, {
        method: 'POST',
      })
    },

    unfavorite(slug: string) {
      return request<SingleArticleResponse>(`/articles/${slug}/favorite`, {
        method: 'DELETE',
      })
    },

    getComments(slug: string) {
      return request<CommentsResponse>(`/articles/${slug}/comments`)
    },

    addComment(slug: string, body: string) {
      return request<CommentResponse>(`/articles/${slug}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment: { body } }),
      })
    },

    deleteComment(slug: string, id: number) {
      return request<void>(`/articles/${slug}/comments/${id}`, {
        method: 'DELETE',
      })
    },

    getTags() {
      return request<TagsResponse>('/tags')
    },
  }
}
