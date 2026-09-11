import { Component, inject, input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-tag-list',
  imports: [RouterLink],
  template: `
    <div class="sidebar">
      <p>Popular Tags</p>
      <div class="tag-list">
        @for (tag of tags(); track tag) {
          <a
            class="tag-pill tag-default"
            [class.active]="activeTag() === tag"
            [routerLink]="['/']"
            [queryParams]="buildTagParams(tag)"
          >
            {{ tag }}
          </a>
        }
      </div>
    </div>
  `,
})
export class TagListComponent {
  readonly tags = input<string[]>([]);
  readonly activeTag = input<string | undefined>();

  private readonly route = inject(ActivatedRoute);

  buildTagParams(tag: string): Record<string, string> {
    const params: Record<string, string> = {};
    const limit = this.route.snapshot.queryParamMap.get('limit');
    if (limit) {
      params['limit'] = limit;
    }
    if (this.activeTag() !== tag) {
      params['tag'] = tag;
    }
    return params;
  }
}
