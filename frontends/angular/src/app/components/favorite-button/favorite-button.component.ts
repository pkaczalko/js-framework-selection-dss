import { Component, inject, input, output, signal } from '@angular/core';
import { ApiService } from '../../api/api.service';
import type { Article } from '../../api/api.types';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-favorite-button',
  template: `
    @if (auth.isAuthenticated()) {
      <button
        type="button"
        class="btn btn-sm btn-outline-primary"
        [class.active]="article().favorited"
        [disabled]="busy()"
        (click)="toggleFavorite()"
      >
        <i class="ion-heart"></i>&nbsp;
        {{ article().favoritesCount }}
      </button>
    }
  `,
})
export class FavoriteButtonComponent {
  readonly article = input.required<Article>();
  readonly changed = output<Article>();

  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  readonly busy = signal(false);

  async toggleFavorite(): Promise<void> {
    if (this.busy()) {
      return;
    }

    this.busy.set(true);
    try {
      const current = this.article();
      const result = current.favorited
        ? await this.api.unfavoriteArticle(current.slug)
        : await this.api.favoriteArticle(current.slug);
      this.changed.emit(result.article);
    } finally {
      this.busy.set(false);
    }
  }
}
