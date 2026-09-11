import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ApiService } from '../../api/api.service';
import type { Article, Profile } from '../../api/api.types';
import { ArticleListComponent } from '../../components/article-list/article-list.component';
import { FollowButtonComponent } from '../../components/follow-button/follow-button.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-profile',
  imports: [RouterLink, FollowButtonComponent, ArticleListComponent, PaginationComponent],
  template: `
    @if (profile(); as prof) {
      <div class="profile-page">
        <div class="user-info">
          <div class="container">
            <div class="row">
              <div class="col-xs-12 col-md-10 offset-md-1">
                <img [src]="prof.image" class="user-img" alt="" />
                <h4>{{ prof.username }}</h4>
                <p>{{ prof.bio }}</p>
                <app-follow-button
                  [profile]="prof"
                  (changed)="updateProfile($event)"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="container">
          <div class="row">
            <div class="col-xs-12 col-md-10 offset-md-1">
              <div class="articles-toggle">
                <ul class="nav nav-pills outline-active">
                  <li class="nav-item">
                    <a
                      class="nav-link"
                      [class.active]="!favorites()"
                      [routerLink]="['/profile', prof.username]"
                    >
                      My Articles
                    </a>
                  </li>
                  <li class="nav-item">
                    <a
                      class="nav-link"
                      [class.active]="favorites()"
                      [routerLink]="['/profile', prof.username, 'favorites']"
                    >
                      Favorited Articles
                    </a>
                  </li>
                </ul>
              </div>

              @if (loading()) {
                <div class="article-preview">Loading...</div>
              } @else {
                <app-article-list
                  [articles]="articles()"
                  (favoriteChanged)="handleFavoriteChange($event)"
                />
                <app-pagination
                  [page]="page()"
                  [totalPages]="totalPages()"
                  (pageChange)="page.set($event)"
                />
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);

  readonly username = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('username') ?? '')),
    { initialValue: '' },
  );

  readonly favorites = toSignal(
    this.route.data.pipe(map((data) => Boolean(data['favorites']))),
    { initialValue: false },
  );

  readonly profile = signal<Profile | null>(null);
  readonly articles = signal<Article[]>([]);
  readonly articlesCount = signal(0);
  readonly page = signal(1);
  readonly loading = signal(true);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.articlesCount() / PAGE_SIZE)),
  );

  private prevFilterKey = '';

  constructor() {
    effect(() => {
      const username = this.username();
      if (!username) {
        this.profile.set(null);
        return;
      }

      this.api
        .getProfile(username)
        .then(({ profile }) => {
          this.profile.set(profile);
        })
        .catch(() => {
          this.profile.set(null);
        });
    });

    effect((onCleanup) => {
      const username = this.username();
      const favorites = this.favorites();

      if (!username) {
        return;
      }

      const filterKey = `${username}-${favorites}`;
      if (filterKey !== this.prevFilterKey) {
        this.prevFilterKey = filterKey;
        this.page.set(1);
      }

      const page = this.page();
      this.loading.set(true);
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });

      const offset = PAGE_SIZE * (page - 1);
      const params = favorites
        ? { favorited: username, limit: PAGE_SIZE, offset }
        : { author: username, limit: PAGE_SIZE, offset };

      this.api
        .getArticles(params)
        .then(({ articles, articlesCount }) => {
          if (!cancelled) {
            this.articles.set(articles);
            this.articlesCount.set(articlesCount);
          }
        })
        .catch(() => {
          if (!cancelled) {
            this.articles.set([]);
            this.articlesCount.set(0);
          }
        })
        .finally(() => {
          if (!cancelled) {
            this.loading.set(false);
          }
        });
    });
  }

  updateProfile(updated: Profile): void {
    this.profile.set(updated);
  }

  handleFavoriteChange(updated: Article): void {
    this.articles.update((prev) =>
      prev.map((a) => (a.slug === updated.slug ? updated : a)),
    );
  }
}
