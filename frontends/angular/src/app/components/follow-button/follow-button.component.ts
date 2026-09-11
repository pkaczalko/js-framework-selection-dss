import { Component, inject, input, output, signal } from '@angular/core';
import { ApiService } from '../../api/api.service';
import type { Profile } from '../../api/api.types';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-follow-button',
  template: `
    @if (auth.user(); as user) {
      @if (user.username !== profile().username) {
        <button
          type="button"
          class="btn btn-sm"
          [class.btn-outline-secondary]="profile().following"
          [class.btn-outline-primary]="!profile().following"
          [disabled]="busy()"
          (click)="toggleFollow()"
        >
          <i class="ion-plus-round"></i>
          &nbsp;
          {{ profile().following ? 'Unfollow' : 'Follow' }} {{ profile().username }}
        </button>
      }
    }
  `,
})
export class FollowButtonComponent {
  readonly profile = input.required<Profile>();
  readonly changed = output<Profile>();

  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  readonly busy = signal(false);

  async toggleFollow(): Promise<void> {
    if (this.busy()) {
      return;
    }

    this.busy.set(true);
    try {
      const current = this.profile();
      const result = current.following
        ? await this.api.unfollowProfile(current.username)
        : await this.api.followProfile(current.username);
      this.changed.emit(result.profile);
    } finally {
      this.busy.set(false);
    }
  }
}
