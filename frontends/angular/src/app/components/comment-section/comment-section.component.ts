import { Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiError, parseErrors } from '../../api/api-error';
import { ApiService } from '../../api/api.service';
import type { Comment } from '../../api/api.types';
import { AuthService } from '../../core/auth.service';
import { formatDate } from '../../utils/format-date';
import { ErrorMessagesComponent } from '../error-messages/error-messages.component';

@Component({
  selector: 'app-comment-section',
  imports: [RouterLink, ErrorMessagesComponent],
  template: `
    <div class="row">
      <div class="col-xs-12">
        @if (auth.isAuthenticated() && auth.user(); as user) {
          <form class="card comment-form" (submit)="handleSubmit($event)">
            <div class="card-block">
              <app-error-messages [errors]="errors()" />
              <textarea
                class="form-control"
                placeholder="Write a comment..."
                rows="3"
                [value]="body()"
                (input)="body.set($any($event.target).value)"
              ></textarea>
            </div>
            <div class="card-footer">
              <img [src]="user.image" class="comment-author-img" alt="" />
              <button type="submit" class="btn btn-sm btn-primary" [disabled]="submitting()">
                Post Comment
              </button>
            </div>
          </form>
        }
        @for (comment of comments(); track comment.id) {
          <div class="card">
            <div class="card-block">
              <p class="card-text">{{ comment.body }}</p>
            </div>
            <div class="card-footer">
              <a [routerLink]="['/profile', comment.author.username]" class="comment-author">
                <img [src]="comment.author.image" class="comment-author-img" alt="" />
              </a>
              &nbsp;
              <a [routerLink]="['/profile', comment.author.username]" class="comment-author">
                {{ comment.author.username }}
              </a>
              <span class="date-posted">{{ formatDate(comment.createdAt) }}</span>
              @if (auth.user()?.username === comment.author.username) {
                <span class="mod-options">
                  <i
                    class="ion-trash-a"
                    role="button"
                    tabindex="0"
                    (click)="handleDelete(comment.id)"
                    (keydown.enter)="handleDelete(comment.id)"
                    (keydown.space)="handleDelete(comment.id)"
                  ></i>
                </span>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class CommentSectionComponent implements OnInit {
  readonly slug = input.required<string>();

  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  readonly comments = signal<Comment[]>([]);
  readonly body = signal('');
  readonly errors = signal<string[]>([]);
  readonly submitting = signal(false);

  readonly formatDate = formatDate;

  ngOnInit(): void {
    this.api.getComments(this.slug()).then(({ comments }) => {
      this.comments.set(comments);
    });
  }

  async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errors.set([]);
    this.submitting.set(true);

    try {
      const { comment } = await this.api.addComment(this.slug(), this.body());
      this.comments.update((prev) => [...prev, comment]);
      this.body.set('');
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        this.errors.set(parseErrors(err.errors));
      }
    } finally {
      this.submitting.set(false);
    }
  }

  async handleDelete(id: number): Promise<void> {
    await this.api.deleteComment(this.slug(), id);
    this.comments.update((prev) => prev.filter((c) => c.id !== id));
  }
}
