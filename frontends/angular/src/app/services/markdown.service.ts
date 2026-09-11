import { inject, Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Injectable({ providedIn: 'root' })
export class MarkdownService {
  private readonly sanitizer = inject(DomSanitizer);

  parse(markdown: string): SafeHtml {
    const html = marked.parse(markdown) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
