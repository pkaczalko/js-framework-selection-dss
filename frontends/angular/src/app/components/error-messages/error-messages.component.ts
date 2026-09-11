import { Component, input } from '@angular/core';

@Component({
  selector: 'app-error-messages',
  template: `
    @if (errors().length > 0) {
      <ul class="error-messages">
        @for (error of errors(); track error) {
          <li>{{ error }}</li>
        }
      </ul>
    }
  `,
})
export class ErrorMessagesComponent {
  readonly errors = input<string[]>([]);
}
