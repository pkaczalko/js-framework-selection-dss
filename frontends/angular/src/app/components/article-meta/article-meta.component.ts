import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Article } from '../../api/api.types';
import { formatDate } from '../../utils/format-date';
import { FavoriteButtonComponent } from '../favorite-button/favorite-button.component';

@Component({
  selector: 'app-article-meta',
  imports: [RouterLink, FavoriteButtonComponent],
  template: `
    <div class="article-meta">
      <a [routerLink]="['/profile', article().author.username]">
        <img [src]="article().author.image" alt="" />
      </a>
      <div class="info">
        <a [routerLink]="['/profile', article().author.username]" class="author">
          {{ article().author.username }}
        </a>
        <span class="date">{{ formatDate(article().createdAt) }}</span>
      </div>
      <app-favorite-button
        [article]="article()"
        (changed)="favoriteChanged.emit($event)"
      />
    </div>
  `,
})
export class ArticleMetaComponent {
  readonly article = input.required<Article>();
  readonly favoriteChanged = output<Article>();

  readonly formatDate = formatDate;
}
