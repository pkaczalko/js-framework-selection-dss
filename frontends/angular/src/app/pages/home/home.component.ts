import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ApiService } from '../../api/api.service';
import type { Article } from '../../api/api.types';
import { AuthService } from '../../core/auth.service';
import { ArticleListComponent } from '../../components/article-list/article-list.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { TagListComponent } from '../../components/tag-list/tag-list.component';

type FeedTab = 'global' | 'personal';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ArticleListComponent, PaginationComponent, TagListComponent],
  template: `
    <div class="home-page">
      <div class="banner">
        <div class="container">
          <h1 class="logo-font">conduit</h1>
          <p>A place to share your knowledge.</p>
        </div>
      </div>

      <div class="container page">
        <div class="row">
          <div class="col-md-9">
            <div class="feed-toggle">
              <ul class="nav nav-pills outline-active">
                @if (auth.isAuthenticated()) {
                  <li class="nav-item">
                    <button
                      type="button"
                      class="nav-link"
                      [class.active]="tab() === 'personal'"
                      (click)="setTab('personal')"
                    >
                      Your Feed
                    </button>
                  </li>
                }
                <li class="nav-item">
                  <button
                    type="button"
                    class="nav-link"
                    [class.active]="tab() === 'global'"
                    (click)="setTab('global')"
                  >
                    {{ tag() ? '#' + tag() : 'Global Feed' }}
                  </button>
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

          <div class="col-md-3">
            <app-tag-list [tags]="tags()" [activeTag]="tag()" />
            @if (tag()) {
              <p>
                <a routerLink="/" [queryParams]="clearTagParams()">Clear tag filter</a>
              </p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly tag = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('tag') ?? undefined)),
    { initialValue: undefined as string | undefined },
  );

  readonly limit = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => Number(params.get('limit') ?? '10') || 10),
    ),
    { initialValue: 10 },
  );

  readonly tab = signal<FeedTab>('global');
  readonly page = signal(1);
  readonly articles = signal<Article[]>([]);
  readonly articlesCount = signal(0);
  readonly tags = signal<string[]>([]);
  readonly loading = signal(true);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.articlesCount() / this.limit())),
  );

  private prevFilterKey = '';

  constructor() {
    effect((onCleanup) => {
      if (this.auth.loading()) {
        return;
      }

      const filterKey = `${this.tag() ?? ''}-${this.tab()}-${this.limit()}`;
      if (filterKey !== this.prevFilterKey) {
        this.prevFilterKey = filterKey;
        this.page.set(1);
      }

      const tag = this.tag();
      const limit = this.limit();
      const tab = this.tab();
      const page = this.page();
      const isAuth = this.auth.isAuthenticated();
      const offset = limit * (page - 1);

      this.loading.set(true);
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });

      const fetchPromise =
        tab === 'personal' && isAuth
          ? this.api.getFeed({ limit, offset })
          : this.api.getArticles({ limit, offset, tag });

      fetchPromise
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

  ngOnInit(): void {
    this.api.getTags().then(({ tags }) => {
      this.tags.set(tags);
    });
  }

  setTab(tab: FeedTab): void {
    this.tab.set(tab);
  }

  handleFavoriteChange(updated: Article): void {
    this.articles.update((prev) =>
      prev.map((a) => (a.slug === updated.slug ? updated : a)),
    );
  }

  clearTagParams(): Record<string, string> {
    const params: Record<string, string> = {};
    const limit = this.route.snapshot.queryParamMap.get('limit');
    if (limit) {
      params['limit'] = limit;
    }
    return params;
  }
}
