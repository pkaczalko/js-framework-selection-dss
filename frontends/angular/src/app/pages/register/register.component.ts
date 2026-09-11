import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError, parseErrors } from '../../api/api-error';
import { AuthService } from '../../core/auth.service';
import { ErrorMessagesComponent } from '../../components/error-messages/error-messages.component';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, ErrorMessagesComponent],
  template: `
    <div class="auth-page">
      <div class="container page">
        <div class="row">
          <div class="col-md-6 offset-md-3 col-xs-12">
            <h1 class="text-xs-center">Sign up</h1>
            <p class="text-xs-center">
              <a routerLink="/login">Have an account?</a>
            </p>
            <app-error-messages [errors]="errors()" />
            <form (submit)="handleSubmit($event)">
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
                  placeholder="Password"
                  [(ngModel)]="password"
                  name="password"
                />
              </fieldset>
              <button type="submit" class="btn btn-lg btn-primary pull-xs-right">
                Sign up
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  email = '';
  password = '';
  readonly errors = signal<string[]>([]);

  async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errors.set([]);

    try {
      await this.auth.register(this.username, this.email, this.password);
      await this.router.navigateByUrl('/');
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        this.errors.set(parseErrors(err.errors));
      }
    }
  }
}
