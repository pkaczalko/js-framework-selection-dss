import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiError } from './api-error';
import type {
  Article,
  ArticlesResponse,
  Comment,
  Profile,
  TagsResponse,
  User,
} from './api.types';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  register(user: { username: string; email: string; password: string }) {
    return this.request<{ user: User }>('POST', '/users', { user });
  }

  login(user: { email: string; password: string }) {
    return this.request<{ user: User }>('POST', '/users/login', { user });
  }

  getCurrentUser() {
    return this.request<{ user: User }>('GET', '/user');
  }

  updateUser(
    user: Partial<{
      email: string;
      username: string;
      password: string;
      image: string;
      bio: string;
    }>,
  ) {
    return this.request<{ user: User }>('PUT', '/user', { user });
  }

  getProfile(username: string) {
    return this.request<{ profile: Profile }>('GET', `/profiles/${username}`);
  }

  followProfile(username: string) {
    return this.request<{ profile: Profile }>('POST', `/profiles/${username}/follow`);
  }

  unfollowProfile(username: string) {
    return this.request<{ profile: Profile }>('DELETE', `/profiles/${username}/follow`);
  }

  getArticles(params: {
    tag?: string;
    author?: string;
    favorited?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.request<ArticlesResponse>('GET', '/articles', undefined, params);
  }

  getFeed(params: { limit?: number; offset?: number }) {
    return this.request<ArticlesResponse>('GET', '/articles/feed', undefined, params);
  }

  getArticle(slug: string) {
    return this.request<{ article: Article }>('GET', `/articles/${slug}`);
  }

  createArticle(article: {
    title: string;
    description: string;
    body: string;
    tagList: string[];
  }) {
    return this.request<{ article: Article }>('POST', '/articles', { article });
  }

  updateArticle(
    slug: string,
    article: Partial<{
      title: string;
      description: string;
      body: string;
      tagList: string[];
    }>,
  ) {
    return this.request<{ article: Article }>('PUT', `/articles/${slug}`, { article });
  }

  deleteArticle(slug: string) {
    return this.request<Record<string, never>>('DELETE', `/articles/${slug}`);
  }

  favoriteArticle(slug: string) {
    return this.request<{ article: Article }>('POST', `/articles/${slug}/favorite`);
  }

  unfavoriteArticle(slug: string) {
    return this.request<{ article: Article }>('DELETE', `/articles/${slug}/favorite`);
  }

  getComments(slug: string) {
    return this.request<{ comments: Comment[] }>('GET', `/articles/${slug}/comments`);
  }

  addComment(slug: string, body: string) {
    return this.request<{ comment: Comment }>('POST', `/articles/${slug}/comments`, {
      comment: { body },
    });
  }

  deleteComment(slug: string, id: number) {
    return this.request<Record<string, never>>(
      'DELETE',
      `/articles/${slug}/comments/${id}`,
    );
  }

  getTags() {
    return this.request<TagsResponse>('GET', '/tags');
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | undefined>,
  ): Promise<T> {
    let params = new HttpParams();
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== '') {
          params = params.set(key, String(value));
        }
      }
    }

    try {
      return await firstValueFrom(
        this.http.request<T>(method, `${this.baseUrl}${path}`, {
          body,
          params: params.keys().length ? params : undefined,
        }),
      );
    } catch (err) {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 422 && err.error?.errors) {
          throw new ApiError(422, err.error.errors);
        }
        throw new ApiError(err.status);
      }
      throw err;
    }
  }
}
