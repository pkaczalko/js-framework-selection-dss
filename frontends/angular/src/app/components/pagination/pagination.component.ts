import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  template: `
    @if (totalPages() > 1) {
      <ul class="pagination">
        <li class="page-item" [class.disabled]="page() === 1">
          <button
            type="button"
            class="page-link"
            [disabled]="page() === 1"
            (click)="pageChange.emit(page() - 1)"
          >
            &laquo; Previous
          </button>
        </li>
        @for (n of pages(); track n) {
          <li class="page-item" [class.active]="page() === n">
            <button type="button" class="page-link" (click)="pageChange.emit(n)">
              {{ n }}
            </button>
          </li>
        }
        <li class="page-item" [class.disabled]="page() === totalPages()">
          <button
            type="button"
            class="page-link"
            [disabled]="page() === totalPages()"
            (click)="pageChange.emit(page() + 1)"
          >
            Next &raquo;
          </button>
        </li>
      </ul>
    }
  `,
})
export class PaginationComponent {
  readonly page = input(1);
  readonly totalPages = input(1);
  readonly pageChange = output<number>();

  pages = () => Array.from({ length: this.totalPages() }, (_, i) => i + 1);
}
