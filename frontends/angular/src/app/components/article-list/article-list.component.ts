import { Component, input, output } from '@angular/core';
import type { Article } from '../../api/api.types';
import { ArticlePreviewComponent } from '../article-preview/article-preview.component';

@Component({
  selector: 'app-article-list',
  imports: [ArticlePreviewComponent],
  template: `
    @for (article of articles(); track article.slug) {
      <app-article-preview
        [article]="article"
        (favoriteChanged)="favoriteChanged.emit($event)"
      />
    }
  `,
})
export class ArticleListComponent {
  readonly articles = input<Article[]>([]);
  readonly favoriteChanged = output<Article>();
}
