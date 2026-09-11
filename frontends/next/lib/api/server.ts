import type {
  Article,
  ArticlesResponse,
  Comment,
  Profile,
  TagsResponse,
  User,
} from './types';
import { API_URL } from './config';

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

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

export const serverApi = {
  getProfile(username: string) {
    return request<{ profile: Profile }>(`/profiles/${username}`);
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

  getArticle(slug: string) {
    return request<{ article: Article }>(`/articles/${slug}`);
  },

  getComments(slug: string) {
    return request<{ comments: Comment[] }>(`/articles/${slug}/comments`);
  },

  getTags() {
    return request<TagsResponse>('/tags');
  },
};

export type ServerApi = typeof serverApi;
