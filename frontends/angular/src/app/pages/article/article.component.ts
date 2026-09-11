import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../api/api.service';
import type { Article } from '../../api/api.types';
import { AuthService } from '../../core/auth.service';
import { MarkdownService } from '../../services/markdown.service';
import { ArticleMetaComponent } from '../../components/article-meta/article-meta.component';
import { CommentSectionComponent } from '../../components/comment-section/comment-section.component';

@Component({
  selector: 'app-article',
  imports: [RouterLink, ArticleMetaComponent, CommentSectionComponent],
  template: `
    @if (article(); as article) {
      <div class="article-page">
        <div class="banner">
          <div class="container">
            <h1>{{ article.title }}</h1>
            <app-article-meta
              [article]="article"
              (favoriteChanged)="updateArticle($event)"
            />
            @if (isAuthor()) {
              <a
                [routerLink]="['/editor', article.slug]"
                class="btn btn-sm btn-outline-secondary"
              >
                <i class="ion-edit"></i> Edit Article
              </a>
            }
          </div>
        </div>

        <div class="container page">
          <div class="row article-content">
            <div class="col-xs-12">
              <div [innerHTML]="htmlBody()"></div>
              <ul class="tag-list">
                @for (tag of article.tagList; track tag) {
                  <li class="tag-default tag-pill tag-outline">{{ tag }}</li>
                }
              </ul>
              @if (isAuthor()) {
                <span class="mod-options">
                  <a [routerLink]="['/editor', article.slug]">
                    <i class="ion-edit"></i>
                  </a>
                  <button
                    type="button"
                    class="btn-link"
                    style="background: none; border: none; cursor: pointer"
                    (click)="handleDelete(article.slug)"
                  >
                    <i class="ion-trash-a"></i>
                  </button>
                </span>
              }
              <hr />
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12 col-md-8 offset-md-2">
              <app-comment-section [slug]="article.slug" />
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ArticleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly markdown = inject(MarkdownService);

  readonly article = signal<Article | null>(null);

  readonly isAuthor = computed(() => {
    const user = this.auth.user();
    const article = this.article();
    return Boolean(user && article && user.username === article.author.username);
  });

  readonly htmlBody = computed(() => {
    const article = this.article();
    if (!article) {
      return '';
    }
    return this.markdown.parse(article.body);
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      return;
    }

    this.api
      .getArticle(slug)
      .then(({ article }) => {
        this.article.set(article);
      })
      .catch(() => {
        void this.router.navigateByUrl('/');
      });
  }

  updateArticle(updated: Article): void {
    this.article.set(updated);
  }

  async handleDelete(slug: string): Promise<void> {
    await this.api.deleteArticle(slug);
    await this.router.navigateByUrl('/');
  }
}
