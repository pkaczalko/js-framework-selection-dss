import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer>
      <div class="container">
        <a routerLink="/" class="logo-font">conduit</a>
        <span class="attribution">
          An interactive learning project from
          <a href="http://thinkster.io">Thinkster</a>. Code &amp; design licensed under MIT.
        </span>
      </div>
    </footer>
  `,
})
export class FooterComponent {}
