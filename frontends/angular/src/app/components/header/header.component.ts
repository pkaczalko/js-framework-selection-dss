import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  template: `
    <nav class="navbar navbar-light">
      <div class="container">
        <a class="navbar-brand" routerLink="/">conduit</a>
        <ul class="nav navbar-nav pull-xs-right">
          <li class="nav-item">
            <a class="nav-link" routerLink="/">Home</a>
          </li>
          @if (auth.isAuthenticated() && auth.user(); as user) {
            <li class="nav-item">
              <a class="nav-link" routerLink="/editor">
                <i class="ion-compose"></i>&nbsp;New Article
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/settings">
                <i class="ion-gear-a"></i>&nbsp;Settings
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" [routerLink]="['/profile', user.username]">
                <img [src]="user.image" class="user-pic" alt="" />
                {{ user.username }}
              </a>
            </li>
          } @else {
            <li class="nav-item">
              <a class="nav-link" routerLink="/login">Sign in</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/register">Sign up</a>
            </li>
          }
        </ul>
      </div>
    </nav>
  `,
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
}
