import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiError, parseErrors } from '../../api/api-error';
import { ApiService } from '../../api/api.service';
import { AuthService } from '../../core/auth.service';
import { ErrorMessagesComponent } from '../../components/error-messages/error-messages.component';

@Component({
  selector: 'app-editor',
  imports: [FormsModule, ErrorMessagesComponent],
  template: `
    @if (!loading()) {
      <div class="editor-page">
        <div class="container page">
          <div class="row">
            <div class="col-md-10 offset-md-1 col-xs-12">
              <app-error-messages [errors]="errors()" />
              <form (submit)="handleSubmit($event)">
                <fieldset>
                  <fieldset class="form-group">
                    <input
                      class="form-control form-control-lg"
                      type="text"
                      placeholder="Article Title"
                      [(ngModel)]="title"
                      name="title"
                    />
                  </fieldset>
                  <fieldset class="form-group">
                    <input
                      class="form-control"
                      type="text"
                      placeholder="What's this article about?"
                      [(ngModel)]="description"
                      name="description"
                    />
                  </fieldset>
                  <fieldset class="form-group">
                    <textarea
                      class="form-control"
                      rows="8"
                      placeholder="Write your article (in markdown)"
                      [(ngModel)]="body"
                      name="body"
                    ></textarea>
                  </fieldset>
                  <fieldset class="form-group">
                    <input
                      class="form-control"
                      type="text"
                      placeholder="Enter tags"
                      [(ngModel)]="tagInput"
                      name="tagInput"
                      (keydown.enter)="addTag($event)"
                    />
                    <div class="tag-list">
                      @for (tag of tagList(); track tag) {
                        <span class="tag-default tag-pill">
                          <i
                            class="ion-close-round"
                            role="button"
                            tabindex="0"
                            (click)="removeTag(tag)"
                            (keydown.enter)="removeTag(tag)"
                            (keydown.space)="removeTag(tag)"
                          ></i>
                          {{ tag }}
                        </span>
                      }
                    </div>
                  </fieldset>
                  <button type="submit" class="btn btn-lg pull-xs-right btn-primary">
                    Publish Article
                  </button>
                  @if (isEditing()) {
                    <button
                      type="button"
                      class="btn btn-outline-danger"
                      (click)="handleDelete()"
                    >
                      Delete Article
                    </button>
                  }
                </fieldset>
              </form>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class EditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly slug = signal<string | null>(null);
  readonly isEditing = signal(false);
  readonly loading = signal(false);

  title = '';
  description = '';
  body = '';
  tagInput = '';
  readonly tagList = signal<string[]>([]);
  readonly errors = signal<string[]>([]);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    this.slug.set(slug);
    this.isEditing.set(Boolean(slug));

    if (!slug) {
      return;
    }

    this.loading.set(true);
    this.api
      .getArticle(slug)
      .then(({ article }) => {
        const user = this.auth.user();
        if (user && article.author.username !== user.username) {
          void this.router.navigateByUrl('/');
          return;
        }
        this.title = article.title;
        this.description = article.description;
        this.body = article.body;
        this.tagList.set(article.tagList);
      })
      .catch(() => {
        void this.router.navigateByUrl('/');
      })
      .finally(() => {
        this.loading.set(false);
      });
  }

  addTag(event: Event): void {
    event.preventDefault();
    const tag = this.tagInput.trim();
    if (tag && !this.tagList().includes(tag)) {
      this.tagList.update((list) => [...list, tag]);
    }
    this.tagInput = '';
  }

  removeTag(tag: string): void {
    this.tagList.update((list) => list.filter((t) => t !== tag));
  }

  async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errors.set([]);

    const articleData = {
      title: this.title,
      description: this.description,
      body: this.body,
      tagList: this.tagList(),
    };

    try {
      if (this.isEditing() && this.slug()) {
        const { article } = await this.api.updateArticle(this.slug()!, articleData);
        await this.router.navigate(['/article', article.slug]);
      } else {
        const { article } = await this.api.createArticle(articleData);
        await this.router.navigate(['/article', article.slug]);
      }
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        this.errors.set(parseErrors(err.errors));
      }
    }
  }

  async handleDelete(): Promise<void> {
    const slug = this.slug();
    if (!slug) {
      return;
    }
    await this.api.deleteArticle(slug);
    await this.router.navigateByUrl('/');
  }
}
