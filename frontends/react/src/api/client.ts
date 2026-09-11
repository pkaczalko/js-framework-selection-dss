import type {
  Article,
  ArticlesResponse,
  Comment,
  Profile,
  TagsResponse,
  User,
} from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, errors?: Record<string, string[]>) {
    super('API Error');
    this.status = status;
    this.errors = errors;
  }
}

export function parseErrors(errors: Record<string, string[]>): string[] {
  return Object.entries(errors).flatMap(([field, messages]) =>
    messages.map((msg) => `${field} ${msg}`),
  );
}

function getToken(): string | null {
  return localStorage.getItem('jwt');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Token ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    if (res.status === 422) {
      const data = (await res.json()) as { errors: Record<string, string[]> };
      throw new ApiError(422, data.errors);
    }
    throw new ApiError(res.status);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return {} as T;
  }

  const text = await res.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  register(user: { username: string; email: string; password: string }) {
    return request<{ user: User }>('/users', {
      method: 'POST',
      body: JSON.stringify({ user }),
    });
  },

  login(user: { email: string; password: string }) {
    return request<{ user: User }>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ user }),
    });
  },

  getCurrentUser() {
    return request<{ user: User }>('/user');
  },

  updateUser(user: Partial<{
    email: string;
    username: string;
    password: string;
    image: string;
    bio: string;
  }>) {
    return request<{ user: User }>('/user', {
      method: 'PUT',
      body: JSON.stringify({ user }),
    });
  },

  getProfile(username: string) {
    return request<{ profile: Profile }>(`/profiles/${username}`);
  },

  followProfile(username: string) {
    return request<{ profile: Profile }>(`/profiles/${username}/follow`, {
      method: 'POST',
    });
  },

  unfollowProfile(username: string) {
    return request<{ profile: Profile }>(`/profiles/${username}/follow`, {
      method: 'DELETE',
    });
  },

  getArticles(params: {
    tag?: string;
    author?: string;
    favorited?: string;
    limit?: number;
    offset?: number;
  }) {
    return request<ArticlesResponse>(`/articles${queryString(params)}`);
  },

  getFeed(params: { limit?: number; offset?: number }) {
    return request<ArticlesResponse>(`/articles/feed${queryString(params)}`);
  },

  getArticle(slug: string) {
    return request<{ article: Article }>(`/articles/${slug}`);
  },

  createArticle(article: {
    title: string;
    description: string;
    body: string;
    tagList: string[];
  }) {
    return request<{ article: Article }>('/articles', {
      method: 'POST',
      body: JSON.stringify({ article }),
    });
  },

  updateArticle(
    slug: string,
    article: Partial<{
      title: string;
      description: string;
      body: string;
      tagList: string[];
    }>,
  ) {
    return request<{ article: Article }>(`/articles/${slug}`, {
      method: 'PUT',
      body: JSON.stringify({ article }),
    });
  },

  deleteArticle(slug: string) {
    return request<Record<string, never>>(`/articles/${slug}`, {
      method: 'DELETE',
    });
  },

  favoriteArticle(slug: string) {
    return request<{ article: Article }>(`/articles/${slug}/favorite`, {
      method: 'POST',
    });
  },

  unfavoriteArticle(slug: string) {
    return request<{ article: Article }>(`/articles/${slug}/favorite`, {
      method: 'DELETE',
    });
  },

  getComments(slug: string) {
    return request<{ comments: Comment[] }>(`/articles/${slug}/comments`);
  },

  addComment(slug: string, body: string) {
    return request<{ comment: Comment }>(`/articles/${slug}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment: { body } }),
    });
  },

  deleteComment(slug: string, id: number) {
    return request<Record<string, never>>(`/articles/${slug}/comments/${id}`, {
      method: 'DELETE',
    });
  },

  getTags() {
    return request<TagsResponse>('/tags');
  },
};
