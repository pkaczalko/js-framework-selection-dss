import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiError, parseErrors } from '../../api/api-error';
import { ApiService } from '../../api/api.service';
import { AuthService } from '../../core/auth.service';
import { ErrorMessagesComponent } from '../../components/error-messages/error-messages.component';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, ErrorMessagesComponent],
  template: `
    <div class="settings-page">
      <div class="container page">
        <div class="row">
          <div class="col-md-6 offset-md-3 col-xs-12">
            <h1 class="text-xs-center">Your Settings</h1>
            <app-error-messages [errors]="errors()" />
            <form (submit)="handleSubmit($event)">
              <fieldset class="form-group">
                <input
                  class="form-control"
                  type="text"
                  placeholder="URL of profile picture"
                  [(ngModel)]="image"
                  name="image"
                />
              </fieldset>
              <fieldset class="form-group">
                <input
                  class="form-control form-control-lg"
                  type="text"
                  placeholder="Username"
                  [(ngModel)]="username"
                  name="username"
                />
              </fieldset>
              <fieldset class="form-group">
                <textarea
                  class="form-control form-control-lg"
                  rows="8"
                  placeholder="Short bio about you"
                  [(ngModel)]="bio"
                  name="bio"
                ></textarea>
              </fieldset>
              <fieldset class="form-group">
                <input
                  class="form-control form-control-lg"
                  type="email"
                  placeholder="Email"
                  [(ngModel)]="email"
                  name="email"
                />
              </fieldset>
              <fieldset class="form-group">
                <input
                  class="form-control form-control-lg"
                  type="password"
                  placeholder="New Password"
                  [(ngModel)]="password"
                  name="password"
                />
              </fieldset>
              <button type="submit" class="btn btn-lg btn-primary pull-xs-right">
                Update Settings
              </button>
            </form>
            <hr />
            <button type="button" class="btn btn-outline-danger" (click)="handleLogout()">
              Or click here to logout.
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  image = '';
  username = '';
  bio = '';
  email = '';
  password = '';
  readonly errors = signal<string[]>([]);

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (user) {
        this.image = user.image;
        this.username = user.username;
        this.bio = user.bio;
        this.email = user.email;
      }
    });
  }

  async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errors.set([]);

    const payload: {
      image: string;
      username: string;
      bio: string;
      email: string;
      password?: string;
    } = {
      image: this.image,
      username: this.username,
      bio: this.bio,
      email: this.email,
    };

    if (this.password) {
      payload.password = this.password;
    }

    try {
      const { user } = await this.api.updateUser(payload);
      this.auth.setUser(user);
      await this.router.navigate(['/profile', user.username]);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        this.errors.set(parseErrors(err.errors));
      }
    }
  }

  async handleLogout(): Promise<void> {
    this.auth.logout();
    await this.router.navigateByUrl('/');
  }
}
